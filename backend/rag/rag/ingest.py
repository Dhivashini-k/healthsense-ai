"""
CLI ingestion command for the HealthSense AI RAG pipeline.

Usage:
    python -m rag.rag.ingest

Orchestrates: load → chunk → embed → store.
Fully rebuilds the vector DB each run (idempotent).
"""

from __future__ import annotations

import time

from rag.rag.loader import load_documents
from rag.rag.chunker import chunk_documents
from rag.rag.embedder import embed_texts
from rag.rag.store import build_collection


def ingest() -> dict:
    """
    Run the full ingestion pipeline:
      1. Load all .md files from knowledge_base/
      2. Chunk documents into retrieval-friendly pieces
      3. Generate embeddings with MiniLM-L6-v2 (or TF-IDF fallback)
      4. Store in ChromaDB (or in-memory fallback)

    Returns a summary dict with stats.
    """
    print("=" * 60)
    print("  HealthSense AI — RAG Ingestion Pipeline")
    print("=" * 60)

    t0 = time.time()

    # ── Step 1: Load ──────────────────────────────────────────────────
    print("\n[1/4] Loading documents from knowledge_base/ ...")
    docs = load_documents()
    print(f"       Found {len(docs)} documents")
    for doc in docs:
        print(f"         • {doc.metadata.get('source_file', '?')}")

    # ── Step 2: Chunk ─────────────────────────────────────────────────
    print("\n[2/4] Chunking documents ...")
    chunks = chunk_documents(docs)
    print(f"       Created {len(chunks)} chunks")

    # ── Step 3: Embed ─────────────────────────────────────────────────
    print("\n[3/4] Generating embeddings ...")
    texts = [c.text for c in chunks]
    embeddings = embed_texts(texts)
    print(f"       Generated {len(embeddings)} embeddings (dim={len(embeddings[0]) if embeddings else '?'})")

    # ── Step 4: Store ─────────────────────────────────────────────────
    print("\n[4/4] Storing in vector store ...")
    stored = build_collection(chunks, embeddings)

    elapsed = time.time() - t0
    print(f"\n{'=' * 60}")
    print(f"  Ingestion complete in {elapsed:.1f}s")
    print(f"  Documents: {len(docs)}  |  Chunks: {len(chunks)}  |  Stored: {stored}")
    print(f"{'=' * 60}")

    return {
        "documents": len(docs),
        "chunks": len(chunks),
        "embeddings": len(embeddings),
        "stored": stored,
        "elapsed_seconds": round(elapsed, 2),
    }


# ── CLI entry point ──────────────────────────────────────────────────────
if __name__ == "__main__":
    ingest()
