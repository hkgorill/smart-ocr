"""파이프라인 통합 테스트 — OCREngine을 Mock으로 대체, 전체 흐름 검증."""

import json
from unittest.mock import MagicMock, patch

import numpy as np
import pytest
from PIL import Image

from core.pipeline import OCRPipeline


def _mock_engine(texts: list[str], conf: float = 0.95):
    """OCREngine.recognize를 원하는 텍스트 목록으로 대체하는 Mock."""
    bbox = [[0, 0], [100, 0], [100, 30], [0, 30]]
    blocks = [{"text": t, "confidence": conf, "bbox": bbox} for t in texts]
    mock = MagicMock()
    mock.recognize.return_value = blocks
    return mock


@pytest.fixture
def pipeline(monkeypatch):
    """실제 모델 없이 동작하는 OCRPipeline fixture."""
    with patch("core.engine.PaddleOCR") as mock_cls:
        mock_cls.return_value = MagicMock()
        import core.engine as eng_module
        eng_module._instances.clear()
        p = OCRPipeline(lang="ko", denoise_img=False, deskew_img=False)
        p._engine = _mock_engine(["안녕하세요", "테스트입니다"])
    return p


@pytest.fixture
def empty_pipeline(monkeypatch):
    with patch("core.engine.PaddleOCR"):
        import core.engine as eng_module
        eng_module._instances.clear()
        p = OCRPipeline(lang="ko", denoise_img=False, deskew_img=False)
        p._engine = _mock_engine([])
    return p


# ── run ───────────────────────────────────────────────────────


@pytest.mark.integration
def test_run_returns_list_of_dicts(pipeline, clean_image):
    results = pipeline.run(clean_image)
    assert isinstance(results, list)
    for item in results:
        assert "text" in item
        assert "confidence" in item
        assert "bbox" in item


@pytest.mark.integration
def test_run_contains_expected_texts(pipeline, clean_image):
    results = pipeline.run(clean_image)
    texts = [r["text"] for r in results]
    assert "안녕하세요" in texts
    assert "테스트입니다" in texts


@pytest.mark.integration
def test_run_accepts_pil_image(pipeline, pil_image):
    results = pipeline.run(pil_image)
    assert isinstance(results, list)


@pytest.mark.integration
def test_run_empty_result(empty_pipeline, clean_image):
    results = empty_pipeline.run(clean_image)
    assert results == []


# ── run_text ──────────────────────────────────────────────────


@pytest.mark.integration
def test_run_text_returns_string(pipeline, clean_image):
    text = pipeline.run_text(clean_image)
    assert isinstance(text, str)
    assert len(text) > 0


@pytest.mark.integration
def test_run_text_empty_when_no_result(empty_pipeline, clean_image):
    assert empty_pipeline.run_text(clean_image) == ""


# ── run_json ──────────────────────────────────────────────────


@pytest.mark.integration
def test_run_json_is_valid_json(pipeline, clean_image):
    output = pipeline.run_json(clean_image)
    parsed = json.loads(output)
    assert isinstance(parsed, list)


@pytest.mark.integration
def test_run_json_preserves_korean(pipeline, clean_image):
    output = pipeline.run_json(clean_image)
    assert "안녕하세요" in output


# ── run_batch ─────────────────────────────────────────────────


@pytest.mark.integration
def test_run_batch_returns_list_per_image(pipeline, clean_image, noisy_image):
    results = pipeline.run_batch([clean_image, noisy_image])
    assert len(results) == 2
    assert all(isinstance(r, list) for r in results)


@pytest.mark.integration
def test_run_batch_empty_list(pipeline):
    assert pipeline.run_batch([]) == []


# ── confidence threshold ──────────────────────────────────────


@pytest.mark.integration
def test_confidence_threshold_filters_blocks(clean_image):
    with patch("core.engine.PaddleOCR"):
        import core.engine as eng_module
        eng_module._instances.clear()
        p = OCRPipeline(lang="ko", confidence_threshold=0.8,
                        denoise_img=False, deskew_img=False)
        p._engine = _mock_engine(["high_conf", "low_conf"], conf=0.5)
    results = p.run(clean_image)
    # conf=0.5 < threshold=0.8 이므로 모두 필터링
    assert results == []
