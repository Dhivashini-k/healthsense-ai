"""
Embedding generation using sentence-transformers/all-MiniLM-L6-v2.

The model is lazily loaded on first call and reused as a singleton to
avoid repeated startup overhead.
"""

from __future__ import annotations

_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_model = None
_USE_TRANSFORMER = True


def _get_model():
    """Lazy-load and cache the SentenceTransformer model."""
    global _model, _USE_TRANSFORMER
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            print(f"[embedder] Loading model: {_MODEL_NAME} ...")
            _model = SentenceTransformer(_MODEL_NAME)
            print(f"[embedder] Model loaded  (dim={_model.get_embedding_dimension()})")
        except ImportError:
            print("[embedder] sentence-transformers not installed. Using TF-IDF fallback.")
            _USE_TRANSFORMER = False
            _model = "tfidf_fallback"
    return _model


def _tfidf_embed(texts: list[str]) -> list[list[float]]:
    """
    Simple TF-IDF-based embedding fallback when sentence-transformers is unavailable.
    Generates 384-dim vectors via hashing trick for compatibility.
    """
    import hashlib
    import math

    dim = 384
    result = []
    for text in texts:
        vec = [0.0] * dim
        words = text.lower().split()
        if not words:
            result.append(vec)
            continue
        for word in words:
            h = int(hashlib.md5(word.encode()).hexdigest(), 16)
            idx = h % dim
            sign = 1.0 if (h // dim) % 2 == 0 else -1.0
            vec[idx] += sign * (1.0 / math.sqrt(len(words)))
        # L2 normalize
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
        vec = [v / norm for v in vec]
        result.append(vec)
    return result


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text strings.

    Returns a list of float vectors, one per input text.
    """
    model = _get_model()
    if not _USE_TRANSFORMER:
        return _tfidf_embed(texts)
    embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    return embeddings.tolist()


def embed_query(query: str) -> list[float]:
    """Generate an embedding for a single query string."""
    return embed_texts([query])[0]
