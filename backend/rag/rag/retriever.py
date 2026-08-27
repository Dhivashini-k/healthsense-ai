"""
Risk-aware semantic retrieval for the HealthSense AI chatbot.

Given a patient question, detected intent, and disease risk profile, this
module retrieves the most relevant knowledge-base chunks with risk-based
re-ranking so that high-priority conditions surface first.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

from rag.rag.embedder import embed_query
from rag.rag.store import query_collection


# ── Boost constants ───────────────────────────────────────────────────────
HIGH_RISK_BOOST = 0.15
MODERATE_RISK_BOOST = 0.05


# ── Condition normalisation ──────────────────────────────────────────────
_CONDITION_ALIASES: dict[str, list[str]] = {
    "hypertension":  ["hypertension"],
    "cvd":           ["cardiovascular", "cvd", "heart"],
    "stroke":        ["stroke"],
    "diabetes":      ["diabetes"],
    "ckd":           ["ckd", "kidney"],
}


def _normalise_risk_profile(risk_profile: dict[str, str]) -> dict[str, str]:
    """Map user-facing disease names (e.g. 'CVD') to lowercase keys."""
    return {k.lower().strip(): v for k, v in risk_profile.items()}


def _condition_matches(chunk_condition: str, disease_key: str) -> bool:
    """Check if a chunk's condition field matches a disease key."""
    chunk_lower = chunk_condition.lower().strip()
    aliases = _CONDITION_ALIASES.get(disease_key, [disease_key])
    return chunk_lower in aliases


# ── Result dataclasses ───────────────────────────────────────────────────

@dataclass
class RetrievedChunk:
    """A single retrieved chunk with scoring details."""
    text: str
    metadata: dict[str, Any]
    similarity_score: float        # raw cosine similarity (1 - distance)
    boosted_score: float           # after risk-based re-ranking
    boost_reason: str              # explanation of any applied boost
    source_file: str
    source_details: list[dict]     # matched source references


@dataclass
class RetrievalResult:
    """Complete retrieval output with debug information."""
    query_used: str
    chunks: list[RetrievedChunk] = field(default_factory=list)
    debug_info: dict[str, Any] = field(default_factory=dict)


# ── Core retrieval logic ─────────────────────────────────────────────────

def _build_enriched_query(question: str, intent: str, risk_profile: dict[str, str]) -> str:
    """
    Enrich the patient question with high-risk condition context to steer
    embedding similarity toward relevant disease-specific content.
    """
    parts = [question]

    # Add high-risk conditions to query for embedding steering
    norm_risks = _normalise_risk_profile(risk_profile)
    high_conditions = [k for k, v in norm_risks.items() if v.lower() == "high"]
    if high_conditions:
        parts.append(" ".join(high_conditions))

    # Add intent keyword if present
    if intent:
        # Convert snake_case to readable words
        intent_words = intent.replace("_", " ")
        parts.append(intent_words)

    return " ".join(parts)


def _compute_boost(
    chunk_condition: str,
    risk_profile: dict[str, str],
) -> tuple[float, str]:
    """
    Compute the metadata-based similarity boost for a chunk.

    Returns (boost_value, reason_string).
    """
    norm_risks = _normalise_risk_profile(risk_profile)

    # General / safety chunks get no boost (they pass through on merit)
    if chunk_condition.lower().strip() in ("general", "all", ""):
        return 0.0, "general content (no boost)"

    # Check each disease in the risk profile
    for disease_key, risk_level in norm_risks.items():
        if _condition_matches(chunk_condition, disease_key):
            level = risk_level.lower()
            if level == "high":
                return HIGH_RISK_BOOST, f"high-risk match: {disease_key}"
            elif level == "moderate":
                return MODERATE_RISK_BOOST, f"moderate-risk match: {disease_key}"
            else:
                return 0.0, f"low-risk match: {disease_key} (no boost)"

    return 0.0, "no matching risk condition"


def _parse_sources(metadata: dict[str, Any]) -> list[dict]:
    """Parse the sources field from metadata (may be JSON string or list)."""
    sources = metadata.get("sources", "[]")
    if isinstance(sources, str):
        try:
            return json.loads(sources)
        except (json.JSONDecodeError, TypeError):
            return []
    return sources if isinstance(sources, list) else []


def retrieve(
    question: str,
    intent: str = "",
    risk_profile: dict[str, str] | None = None,
    top_k: int = 8,
    initial_fetch: int = 15,
) -> RetrievalResult:
    """
    Perform risk-aware semantic retrieval.

    Args:
        question:      The patient's question.
        intent:        Detected intent (e.g. "diet_guidance").
        risk_profile:  Dict mapping disease → risk level, e.g.
                       {"Hypertension": "High", "CVD": "Moderate", ...}.
        top_k:         Number of chunks to return after re-ranking.
        initial_fetch: Number of candidates to fetch from the store.

    Returns:
        RetrievalResult with re-ranked chunks and debug information.
    """
    if risk_profile is None:
        risk_profile = {}

    # 1. Build enriched query
    enriched_query = _build_enriched_query(question, intent, risk_profile)

    # 2. Embed the enriched query
    query_embedding = embed_query(enriched_query)

    # 3. Fetch candidates from vector store
    raw_results = query_collection(query_embedding, n_results=initial_fetch)

    # 4. Re-rank with metadata-based boosting
    scored_chunks: list[RetrievedChunk] = []

    ids = raw_results.get("ids", [[]])[0]
    documents = raw_results.get("documents", [[]])[0]
    metadatas = raw_results.get("metadatas", [[]])[0]
    distances = raw_results.get("distances", [[]])[0]

    for i, (doc_id, text, meta, distance) in enumerate(zip(ids, documents, metadatas, distances)):
        # Cosine distance: distance = 1 - cosine_similarity
        similarity = 1.0 - distance

        chunk_condition = meta.get("condition", "general")
        boost, reason = _compute_boost(chunk_condition, risk_profile)

        boosted = similarity + boost
        sources = _parse_sources(meta)

        scored_chunks.append(RetrievedChunk(
            text=text,
            metadata=meta,
            similarity_score=round(similarity, 4),
            boosted_score=round(boosted, 4),
            boost_reason=reason,
            source_file=meta.get("source_file", "unknown"),
            source_details=sources,
        ))

    # 5. Sort by boosted score (descending) and take top-k
    scored_chunks.sort(key=lambda c: c.boosted_score, reverse=True)

    # Deduplicate by source_file + section_title (keep highest scored)
    seen: set[str] = set()
    deduped: list[RetrievedChunk] = []
    for chunk in scored_chunks:
        dedup_key = f"{chunk.source_file}::{chunk.metadata.get('section_title', '')}"
        if dedup_key not in seen:
            seen.add(dedup_key)
            deduped.append(chunk)

    final_chunks = deduped[:top_k]

    # 6. Build debug info
    debug_info = {
        "enriched_query": enriched_query,
        "risk_profile": risk_profile,
        "candidates_fetched": len(ids),
        "after_dedup": len(deduped),
        "returned": len(final_chunks),
        "scoring_breakdown": [
            {
                "source_file": c.source_file,
                "section": c.metadata.get("section_title", ""),
                "condition": c.metadata.get("condition", ""),
                "similarity": c.similarity_score,
                "boost": round(c.boosted_score - c.similarity_score, 4),
                "boosted_score": c.boosted_score,
                "reason": c.boost_reason,
            }
            for c in final_chunks
        ],
    }

    return RetrievalResult(
        query_used=enriched_query,
        chunks=final_chunks,
        debug_info=debug_info,
    )
