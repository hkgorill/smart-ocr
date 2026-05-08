"""OCR 엔진 단위 테스트 — PaddleOCR를 Mock으로 대체해 모델 로딩 없이 실행."""

from unittest.mock import MagicMock, patch

import numpy as np
import pytest

from core.engine import OCREngine


def _make_raw_result(text: str = "테스트", conf: float = 0.95):
    """PaddleOCR.ocr() 반환 형식과 동일한 더미 결과."""
    bbox = [[10.0, 10.0], [100.0, 10.0], [100.0, 40.0], [10.0, 40.0]]
    return [[[bbox, (text, conf)]]]


# ── _parse ────────────────────────────────────────────────────


@pytest.mark.unit
def test_parse_normal_result():
    raw = _make_raw_result("안녕하세요", 0.98)
    result = OCREngine._parse(raw)
    assert len(result) == 1
    assert result[0]["text"] == "안녕하세요"
    assert result[0]["confidence"] == 0.98


@pytest.mark.unit
def test_parse_returns_int_bbox():
    raw = _make_raw_result()
    result = OCREngine._parse(raw)
    for point in result[0]["bbox"]:
        assert isinstance(point[0], int)
        assert isinstance(point[1], int)


@pytest.mark.unit
def test_parse_empty_input():
    assert OCREngine._parse(None) == []
    assert OCREngine._parse([]) == []
    assert OCREngine._parse([[]]) == []


@pytest.mark.unit
def test_parse_multiple_blocks():
    bbox = [[0.0, 0.0], [100.0, 0.0], [100.0, 30.0], [0.0, 30.0]]
    raw = [[[bbox, ("첫째", 0.9)], [bbox, ("둘째", 0.8)]]]
    result = OCREngine._parse(raw)
    assert len(result) == 2
    assert result[0]["text"] == "첫째"


# ── recognize (Mock) ─────────────────────────────────────────


@pytest.mark.unit
@patch("core.engine.PaddleOCR")
def test_recognize_calls_ocr(mock_paddle_cls):
    mock_ocr = MagicMock()
    mock_ocr.ocr.return_value = _make_raw_result("Hello", 0.99)
    mock_paddle_cls.return_value = mock_ocr

    engine = OCREngine(lang="en", use_gpu=False)
    img = np.zeros((100, 200, 3), dtype=np.uint8)
    result = engine.recognize(img)

    mock_ocr.ocr.assert_called_once_with(img, cls=True)
    assert result[0]["text"] == "Hello"
    assert result[0]["confidence"] == 0.99


@pytest.mark.unit
@patch("core.engine.PaddleOCR")
def test_recognize_returns_empty_on_no_text(mock_paddle_cls):
    mock_ocr = MagicMock()
    mock_ocr.ocr.return_value = [[]]
    mock_paddle_cls.return_value = mock_ocr

    engine = OCREngine(lang="en")
    result = engine.recognize(np.zeros((100, 100, 3), dtype=np.uint8))
    assert result == []


# ── singleton ─────────────────────────────────────────────────


@pytest.mark.unit
@patch("core.engine.PaddleOCR")
def test_get_returns_same_instance(mock_paddle_cls):
    mock_paddle_cls.return_value = MagicMock()
    # 캐시 초기화
    import core.engine as eng_module
    eng_module._instances.clear()

    a = OCREngine.get(lang="en", use_gpu=False)
    b = OCREngine.get(lang="en", use_gpu=False)
    assert a is b


@pytest.mark.unit
@patch("core.engine.PaddleOCR")
def test_get_different_lang_different_instance(mock_paddle_cls):
    mock_paddle_cls.return_value = MagicMock()
    import core.engine as eng_module
    eng_module._instances.clear()

    a = OCREngine.get(lang="en")
    b = OCREngine.get(lang="ko")
    assert a is not b
