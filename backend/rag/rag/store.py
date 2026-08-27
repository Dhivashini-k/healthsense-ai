"""
ChromaDB vector store management for the HealthSense AI knowledge base.

Stores embeddings persistently at rag/chroma_db/ and provides
methods to build (ingest) and query the collection.

Falls back to an in-memory brute-force search if ChromaDB is not installed.
"""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
from typing import Any

from rag.rag.chunker import Chunk

# ── Config ────────────────────────────────────────────────────────────────
CHROMA_DIR = Path(__file__).resolve().parent.parent / "chroma_db"
COLLECTION_NAME = "health_knowledge"

# In-memory fallback store
_FALLBACK_STORE: dict[str, Any] | None = None
_USE_CHROMA = True


def _check_chroma():
    global _USE_CHROMA
    try:
        import chromadb  # noqa: F401
        _USE_CHROMA = True
    except ImportError:
        _USE_CHROMA = False
    return _USE_CHROMA


def _get_client():
    """Return a persistent ChromaDB client."""
    import chromadb
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(path=str(CHROMA_DIR))


def _chunk_id(chunk: Chunk) -> str:
    """Deterministic ID from source_file + chunk_index."""
    key = f"{chunk.metadata.get('source_file', 'unknown')}::{chunk.metadata.get('chunk_index', 0)}"
    return hashlib.sha256(key.encode()).hexdigest()[:16]


def _serialise_metadata(meta: dict[str, Any]) -> dict[str, str | int | float | bool]:
    """
    Flatten metadata for ChromaDB (which only accepts scalar values).

    Lists and dicts are JSON-serialised to strings.
    """
    flat: dict[str, str | int | float | bool] = {}
    for k, v in meta.items():
        if isinstance(v, (str, int, float, bool)):
            flat[k] = v
        elif isinstance(v, list):
            flat[k] = json.dumps(v)
        elif isinstance(v, dict):
            flat[k] = json.dumps(v)
        else:
            flat[k] = str(v)
    return flat


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a)) or 1.0
    norm_b = math.sqrt(sum(x * x for x in b)) or 1.0
    return dot / (norm_a * norm_b)


def build_collection(chunks: list[Chunk], embeddings: list[list[float]]) -> int:
    """
    (Re)build the vector store from chunks and their embeddings.

    Uses ChromaDB if available, otherwise stores in memory.
    Returns the number of chunks stored.
    """
    if _check_chroma():
        return _build_chroma(chunks, embeddings)
    else:
        return _build_fallback(chunks, embeddings)


def _build_chroma(chunks: list[Chunk], embeddings: list[list[float]]) -> int:
    """Build ChromaDB collection."""
    client = _get_client()

    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass

    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    ids = [_chunk_id(c) for c in chunks]
    documents = [c.text for c in chunks]
    metadatas = [_serialise_metadata(c.metadata) for c in chunks]

    collection.add(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    print(f"[store] Stored {len(ids)} chunks in ChromaDB collection '{COLLECTION_NAME}'")
    return len(ids)


def _build_fallback(chunks: list[Chunk], embeddings: list[list[float]]) -> int:
    """Build in-memory fallback store."""
    global _FALLBACK_STORE
    _FALLBACK_STORE = {
        "ids": [_chunk_id(c) for c in chunks],
        "documents": [c.text for c in chunks],
        "metadatas": [_serialise_metadata(c.metadata) for c in chunks],
        "embeddings": embeddings,
    }
    print(f"[store] Stored {len(chunks)} chunks in memory (ChromaDB fallback)")
    return len(chunks)


def query_collection(
    query_embedding: list[float],
    n_results: int = 15,
) -> dict[str, Any]:
    """
    Query the collection with a pre-computed embedding.

    Returns results dict with keys: ids, documents, metadatas, distances
    """
    if _check_chroma():
        return _query_chroma(query_embedding, n_results)
    else:
        return _query_fallback(query_embedding, n_results)


def _query_chroma(query_embedding: list[float], n_results: int) -> dict[str, Any]:
    """Query ChromaDB collection."""
    client = _get_client()
    collection = client.get_collection(name=COLLECTION_NAME)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )
    return results


def _query_fallback(query_embedding: list[float], n_results: int) -> dict[str, Any]:
    """Query in-memory fallback store using brute-force cosine similarity."""
    global _FALLBACK_STORE
    if _FALLBACK_STORE is None:
        return {"ids": [[]], "documents": [[]], "metadatas": [[]], "distances": [[]]}

    # Compute similarities
    scored = []
    for i, emb in enumerate(_FALLBACK_STORE["embeddings"]):
        sim = _cosine_similarity(query_embedding, emb)
        distance = 1.0 - sim  # cosine distance
        scored.append((i, distance))

    # Sort by distance (ascending = most similar first)
    scored.sort(key=lambda x: x[1])
    top = scored[:n_results]

    return {
        "ids": [[_FALLBACK_STORE["ids"][i] for i, _ in top]],
        "documents": [[_FALLBACK_STORE["documents"][i] for i, _ in top]],
        "metadatas": [[_FALLBACK_STORE["metadatas"][i] for i, _ in top]],
        "distances": [[d for _, d in top]],
    }
