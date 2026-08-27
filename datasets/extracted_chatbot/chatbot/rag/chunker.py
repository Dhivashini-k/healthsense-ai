"""
Section-aware document chunking for the knowledge base.

Splits markdown documents on section headers (## ...) first, then applies
a character-length limit for sections that are too long.  Each chunk carries
the full metadata from its parent document plus chunk-specific fields.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

from chatbot.rag.loader import KBDocument


# ── Tunables ──────────────────────────────────────────────────────────────
MAX_CHUNK_CHARS = 500     # soft max characters per chunk
OVERLAP_CHARS = 50        # overlap between sub-chunks within a long section


@dataclass
class Chunk:
    """A retrieval-friendly chunk with text and full metadata."""

    text: str
    metadata: dict[str, Any] = field(default_factory=dict)


def _split_into_sections(content: str) -> list[tuple[str, str]]:
    """
    Split markdown content by ## headings.

    Returns a list of (section_title, section_body) tuples.
    The first tuple may have an empty title if content precedes the first heading.
    """
    # Split on lines that start with ## (level-2 headings)
    parts = re.split(r"(?m)^(#{1,3}\s+.+)$", content)

    sections: list[tuple[str, str]] = []
    current_title = ""
    current_body_parts: list[str] = []

    for part in parts:
        stripped = part.strip()
        if re.match(r"^#{1,3}\s+", stripped):
            # Flush previous section
            if current_body_parts or current_title:
                sections.append((current_title, "\n".join(current_body_parts).strip()))
            current_title = re.sub(r"^#{1,3}\s+", "", stripped).strip()
            current_body_parts = []
        else:
            if stripped:
                current_body_parts.append(stripped)

    # Flush last section
    if current_body_parts or current_title:
        sections.append((current_title, "\n".join(current_body_parts).strip()))

    return sections


def _sub_chunk(text: str, max_chars: int = MAX_CHUNK_CHARS, overlap: int = OVERLAP_CHARS) -> list[str]:
    """Split a long text into overlapping sub-chunks by character boundary."""
    if len(text) <= max_chars:
        return [text]

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + max_chars
        chunk = text[start:end]

        # Try to break at the last newline or sentence boundary within the chunk
        if end < len(text):
            last_break = chunk.rfind("\n")
            if last_break == -1:
                last_break = chunk.rfind(". ")
            if last_break > max_chars // 2:
                chunk = chunk[: last_break + 1]
                end = start + last_break + 1

        chunks.append(chunk.strip())
        start = end - overlap

    return [c for c in chunks if c]


def chunk_document(doc: KBDocument) -> list[Chunk]:
    """
    Split a KBDocument into retrieval-friendly chunks.

    Each chunk contains only the document body text (no YAML metadata in the
    embedding text).  Metadata is carried separately on every chunk.
    """
    sections = _split_into_sections(doc.content)
    chunks: list[Chunk] = []
    chunk_idx = 0

    for section_title, section_body in sections:
        if not section_body:
            continue

        sub_chunks = _sub_chunk(section_body)
        for sub_text in sub_chunks:
            meta = dict(doc.metadata)  # copy parent metadata
            meta["chunk_index"] = chunk_idx
            meta["section_title"] = section_title
            chunks.append(Chunk(text=sub_text, metadata=meta))
            chunk_idx += 1

    return chunks


def chunk_documents(docs: list[KBDocument]) -> list[Chunk]:
    """Chunk a list of KBDocuments into a flat list of Chunks."""
    all_chunks: list[Chunk] = []
    for doc in docs:
        all_chunks.extend(chunk_document(doc))
    return all_chunks
