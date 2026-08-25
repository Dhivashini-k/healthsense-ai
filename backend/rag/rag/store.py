"""
ChromaDB vector store management for the HealthSense AI knowledge base.

Stores embeddings persistently at chatbot/chroma_db/ and provides
methods to build (ingest) and query the collection.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import chromadb

from chatbot.rag.chunker import Chunk

# ── Config ────────────────────────────────────────────────────────────────
CHROMA_DIR = Path(__file__).resolve().parent.parent / "chroma_db"
COLLECTION_NAME = "health_knowledge"


def _get_client() -> chromadb.ClientAPI:
    """Return a persistent ChromaDB client."""
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


def build_collection(chunks: list[Chunk], embeddings: list[list[float]]) -> int:
    """
    (Re)build the ChromaDB collection from chunks and their embeddings.

    Deletes any existing collection and creates it fresh (idempotent rebuild).
    Returns the number of chunks stored.
    """
    client = _get_client()

    # Drop existing collection for a clean rebuild
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

    # ChromaDB accepts batches up to ~5000; our KB is small so single batch is fine
    collection.add(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    print(f"[store] Stored {len(ids)} chunks in collection '{COLLECTION_NAME}'")
    return len(ids)


def query_collection(
    query_embedding: list[float],
    n_results: int = 15,
) -> dict[str, Any]:
    """
    Query the collection with a pre-computed embedding.

    Returns raw ChromaDB results dict with keys:
        ids, documents, metadatas, distances
    """
    client = _get_client()
    collection = client.get_collection(
        name=COLLECTION_NAME,
    )

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )
    return results
