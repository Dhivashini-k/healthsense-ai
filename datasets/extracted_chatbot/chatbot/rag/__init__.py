"""
HealthSense AI — RAG (Retrieval-Augmented Generation) Pipeline.

Public API:
    ingest()   — rebuild the vector database from knowledge_base/ markdown files
    retrieve() — semantic retrieval with risk-aware re-ranking
"""

from chatbot.rag.retriever import retrieve

__all__ = ["retrieve"]


def ingest():
    """Lazy import to avoid circular import when running as __main__."""
    from chatbot.rag.ingest import ingest as _ingest
    return _ingest()
