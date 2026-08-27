"""
Markdown document loader with YAML front matter parsing.

Recursively discovers all .md files under the knowledge_base/ directory,
parses YAML metadata separately from document content, and enriches
each document with source information from metadata/sources.json.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import frontmatter


# Root of the knowledge base relative to this file
KB_ROOT = Path(__file__).resolve().parent.parent / "knowledge_base"


@dataclass
class KBDocument:
    """A single knowledge-base document with parsed metadata and body content."""

    content: str
    metadata: dict[str, Any] = field(default_factory=dict)


def _load_sources(kb_root: Path) -> dict[str, list[dict]]:
    """Load metadata/sources.json and index by category."""
    sources_path = kb_root / "metadata" / "sources.json"
    if not sources_path.exists():
        return {}

    with open(sources_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    by_category: dict[str, list[dict]] = {}
    for src in data.get("sources", []):
        cat = src.get("category", "general")
        by_category.setdefault(cat, []).append(src)
    return by_category


def _normalize_condition(condition: str) -> str:
    """Normalize condition names to match sources.json categories."""
    mapping = {
        "cardiovascular": "cvd",
        "heart": "cvd",
        "kidney": "ckd",
    }
    lower = condition.lower().strip()
    return mapping.get(lower, lower)


def load_documents(kb_root: Path | None = None) -> list[KBDocument]:
    """
    Recursively load all .md files from the knowledge base.

    Returns a list of KBDocument objects with:
        - content: the document body (YAML front matter stripped)
        - metadata: parsed YAML fields + source_file + matched source info
    """
    if kb_root is None:
        kb_root = KB_ROOT

    kb_root = Path(kb_root).resolve()
    sources_by_cat = _load_sources(kb_root)

    documents: list[KBDocument] = []

    for md_path in sorted(kb_root.rglob("*.md")):
        # Parse YAML front matter and body
        post = frontmatter.load(str(md_path))

        body = post.content.strip()
        if not body:
            continue

        # Build metadata dict from YAML fields
        meta: dict[str, Any] = {}
        for key in ("title", "condition", "topic", "audience", "tags"):
            if key in post.metadata:
                meta[key] = post.metadata[key]

        # Relative path from KB root for traceability
        rel_path = md_path.relative_to(kb_root).as_posix()
        meta["source_file"] = rel_path

        # Match source information by condition/category
        condition = meta.get("condition", "general")
        norm_condition = _normalize_condition(condition)
        matched_sources = sources_by_cat.get(norm_condition, [])
        if matched_sources:
            meta["sources"] = [
                {"organization": s["organization"], "title": s["title"], "url": s.get("url", "")}
                for s in matched_sources
            ]

        documents.append(KBDocument(content=body, metadata=meta))

    return documents
