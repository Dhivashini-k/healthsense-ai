"""
Embedding generation using sentence-transformers/all-MiniLM-L6-v2.

The model is lazily loaded on first call and reused as a singleton to
avoid repeated startup overhead.
"""

from __future__ import annotations

from sentence_transformers import SentenceTransformer

# ── Singleton ─────────────────────────────────────────────────────────────
_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    """Lazy-load and cache the SentenceTransformer model."""
    global _model
    if _model is None:
        print(f"[embedder] Loading model: {_MODEL_NAME} ...")
        _model = SentenceTransformer(_MODEL_NAME)
        print(f"[embedder] Model loaded  (dim={_model.get_embedding_dimension()})")
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text strings.

    Returns a list of float vectors, one per input text.
    """
    model = _get_model()
    embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    return embeddings.tolist()


def embed_query(query: str) -> list[float]:
    """Generate an embedding for a single query string."""
    return embed_texts([query])[0]
