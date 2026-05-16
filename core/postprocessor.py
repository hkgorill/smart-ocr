"""OCR 결과 후처리 — 정렬, 정제, JSON 직렬화."""

from __future__ import annotations

import re


def _bbox_top_left_y(block: dict) -> int:
    """bbox 의 최소 y 좌표 (읽기 순서 정렬 기준)."""
    return min(p[1] for p in block["bbox"])


def _bbox_top_left_x(block: dict) -> int:
    return min(p[0] for p in block["bbox"])


def sort_reading_order(blocks: list[dict], line_gap: int = 20) -> list[dict]:
    """블록을 위→아래, 같은 줄이면 왼→오른쪽 순서로 정렬.

    line_gap: y 좌표 차이가 이 값 이내면 같은 줄로 간주.
    """
    if not blocks:
        return blocks

    sorted_y = sorted(blocks, key=_bbox_top_left_y)
    lines: list[list[dict]] = []
    current_line: list[dict] = [sorted_y[0]]
    current_y = _bbox_top_left_y(sorted_y[0])

    for block in sorted_y[1:]:
        y = _bbox_top_left_y(block)
        if abs(y - current_y) <= line_gap:
            current_line.append(block)
        else:
            lines.append(sorted(current_line, key=_bbox_top_left_x))
            current_line = [block]
            current_y = y
    lines.append(sorted(current_line, key=_bbox_top_left_x))

    return [b for line in lines for b in line]


def clean_text(text: str) -> str:
    """불필요한 공백·제어문자 제거."""
    text = re.sub(r"[\x00-\x1f\x7f]", " ", text)
    return re.sub(r" {2,}", " ", text).strip()


def filter_low_confidence(blocks: list[dict],
                           threshold: float = 0.3) -> list[dict]:
    """신뢰도 threshold 미만 블록 제거."""
    return [b for b in blocks if b["confidence"] >= threshold]


def postprocess(blocks: list[dict],
                *,
                confidence_threshold: float = 0.3,
                sort: bool = True) -> list[dict]:
    """후처리 파이프라인 진입점."""
    blocks = filter_low_confidence(blocks, confidence_threshold)
    for b in blocks:
        b["text"] = clean_text(b["text"])
    blocks = [b for b in blocks if b["text"]]
    if sort:
        blocks = sort_reading_order(blocks)
    return blocks


def to_plain_text(blocks: list[dict]) -> str:
    """블록 리스트를 단순 줄 구분 문자열로 변환."""
    return "\n".join(b["text"] for b in blocks)
