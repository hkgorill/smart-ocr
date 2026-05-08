"""후처리 모듈 단위 테스트."""

import pytest

from core.postprocessor import (
    clean_text,
    filter_low_confidence,
    postprocess,
    sort_reading_order,
    to_plain_text,
)


def _block(text, conf, x, y):
    return {
        "text": text,
        "confidence": conf,
        "bbox": [[x, y], [x + 80, y], [x + 80, y + 20], [x, y + 20]],
    }


# ── clean_text ────────────────────────────────────────────────


@pytest.mark.unit
def test_clean_text_strips_whitespace():
    assert clean_text("  hello  ") == "hello"


@pytest.mark.unit
def test_clean_text_removes_control_chars():
    assert "\x00" not in clean_text("hello\x00world")


@pytest.mark.unit
def test_clean_text_collapses_spaces():
    assert clean_text("hello   world") == "hello world"


@pytest.mark.unit
def test_clean_text_empty_string():
    assert clean_text("") == ""


# ── filter_low_confidence ────────────────────────────────────


@pytest.mark.unit
def test_filter_removes_low_confidence():
    blocks = [_block("a", 0.3, 0, 0), _block("b", 0.9, 0, 30)]
    result = filter_low_confidence(blocks, threshold=0.5)
    assert len(result) == 1
    assert result[0]["text"] == "b"


@pytest.mark.unit
def test_filter_keeps_exact_threshold():
    blocks = [_block("a", 0.5, 0, 0)]
    result = filter_low_confidence(blocks, threshold=0.5)
    assert len(result) == 1


@pytest.mark.unit
def test_filter_empty_input():
    assert filter_low_confidence([], threshold=0.5) == []


# ── sort_reading_order ────────────────────────────────────────


@pytest.mark.unit
def test_sort_top_to_bottom():
    blocks = [_block("second", 0.9, 0, 50), _block("first", 0.9, 0, 0)]
    result = sort_reading_order(blocks)
    assert result[0]["text"] == "first"
    assert result[1]["text"] == "second"


@pytest.mark.unit
def test_sort_left_to_right_same_line():
    blocks = [_block("right", 0.9, 200, 0), _block("left", 0.9, 0, 0)]
    result = sort_reading_order(blocks)
    assert result[0]["text"] == "left"
    assert result[1]["text"] == "right"


@pytest.mark.unit
def test_sort_empty_input():
    assert sort_reading_order([]) == []


@pytest.mark.unit
def test_sort_single_block():
    blocks = [_block("only", 0.9, 0, 0)]
    result = sort_reading_order(blocks)
    assert len(result) == 1


# ── to_plain_text ─────────────────────────────────────────────


@pytest.mark.unit
def test_to_plain_text_joins_with_newline():
    blocks = [_block("line1", 0.9, 0, 0), _block("line2", 0.9, 0, 50)]
    result = to_plain_text(sort_reading_order(blocks))
    assert result == "line1\nline2"


@pytest.mark.unit
def test_to_plain_text_empty():
    assert to_plain_text([]) == ""


# ── postprocess (통합) ────────────────────────────────────────


@pytest.mark.unit
def test_postprocess_filters_and_sorts():
    blocks = [
        _block("second", 0.9, 0, 50),
        _block("low_conf", 0.2, 0, 0),
        _block("first", 0.9, 0, 0),
    ]
    result = postprocess(blocks, confidence_threshold=0.5, sort=True)
    texts = [b["text"] for b in result]
    assert "low_conf" not in texts
    assert texts.index("first") < texts.index("second")


@pytest.mark.unit
def test_postprocess_removes_empty_text_after_clean():
    blocks = [_block("\x00\x01", 0.9, 0, 0), _block("good", 0.9, 0, 50)]
    result = postprocess(blocks)
    texts = [b["text"] for b in result]
    assert "good" in texts
    assert all(t for t in texts)


@pytest.mark.unit
def test_postprocess_empty_input():
    assert postprocess([]) == []
