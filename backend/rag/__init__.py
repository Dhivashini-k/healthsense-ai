"""HealthSense AI RAG package — exposes retrieve() and ingest()."""

import sys
import os

# Ensure the backend directory is in sys.path so rag.rag imports work
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

_RAG_AVAILABLE = False

try:
    from rag.rag.retriever import retrieve
    _RAG_AVAILABLE = True
except Exception as e:
    print(f"[rag] Warning: RAG retriever not available: {e}")
    retrieve = None

__all__ = ["retrieve", "ingest", "_RAG_AVAILABLE"]


def ingest():
    """Lazy import to avoid circular import when running as __main__."""
    from rag.rag.ingest import ingest as _ingest
    return _ingest()
