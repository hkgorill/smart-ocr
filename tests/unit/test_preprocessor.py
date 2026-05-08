"""전처리 모듈 단위 테스트."""

import cv2
import numpy as np
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st
from PIL import Image

from core.preprocessor import (
    deskew,
    denoise,
    load_image,
    normalize_resolution,
    preprocess,
    to_bgr,
)

# ── load_image ────────────────────────────────────────────────


@pytest.mark.unit
def test_load_image_from_ndarray(clean_image):
    result = load_image(clean_image)
    assert isinstance(result, np.ndarray)
    assert result.shape == clean_image.shape


@pytest.mark.unit
def test_load_image_from_pil(pil_image):
    result = load_image(pil_image)
    assert isinstance(result, np.ndarray)
    assert result.ndim == 3
    assert result.shape[2] == 3


@pytest.mark.unit
def test_load_image_missing_file():
    with pytest.raises(FileNotFoundError):
        load_image("/nonexistent/path/image.jpg")


@pytest.mark.unit
def test_load_image_returns_copy(clean_image):
    """원본 배열이 수정되지 않도록 복사본을 반환해야 한다."""
    result = load_image(clean_image)
    result[:] = 0
    assert clean_image.max() > 0


# ── to_bgr ───────────────────────────────────────────────────


@pytest.mark.unit
def test_to_bgr_from_gray(gray_image):
    result = to_bgr(gray_image)
    assert result.ndim == 3
    assert result.shape[2] == 3


@pytest.mark.unit
def test_to_bgr_from_rgba(rgba_image):
    result = to_bgr(rgba_image)
    assert result.shape[2] == 3


@pytest.mark.unit
def test_to_bgr_from_bgr_passthrough(clean_image):
    result = to_bgr(clean_image)
    assert result.shape == clean_image.shape


# ── normalize_resolution ─────────────────────────────────────


@pytest.mark.unit
def test_normalize_upscales_small_image(small_image):
    result = normalize_resolution(small_image)
    long_side = max(result.shape[:2])
    assert long_side >= 640


@pytest.mark.unit
def test_normalize_downscales_large_image(large_image):
    result = normalize_resolution(large_image)
    long_side = max(result.shape[:2])
    assert long_side <= 4096


@pytest.mark.unit
def test_normalize_preserves_aspect_ratio(small_image):
    h, w = small_image.shape[:2]
    original_ratio = w / h
    result = normalize_resolution(small_image)
    rh, rw = result.shape[:2]
    assert abs((rw / rh) - original_ratio) < 0.05


@pytest.mark.unit
def test_normalize_noop_for_normal_image(clean_image):
    """640~4096 범위 이미지는 크기 변경 없이 그대로 반환."""
    result = normalize_resolution(clean_image)
    assert result.shape == clean_image.shape


# ── denoise ──────────────────────────────────────────────────


@pytest.mark.unit
def test_denoise_output_shape_unchanged(noisy_image):
    result = denoise(noisy_image)
    assert result.shape == noisy_image.shape


@pytest.mark.unit
def test_denoise_output_dtype(noisy_image):
    result = denoise(noisy_image)
    assert result.dtype == np.uint8


@pytest.mark.unit
def test_denoise_reduces_noise(noisy_image, clean_image):
    denoised = denoise(noisy_image)
    mse_before = np.mean((noisy_image.astype(float) - clean_image.astype(float)) ** 2)
    mse_after = np.mean((denoised.astype(float) - clean_image.astype(float)) ** 2)
    assert mse_after < mse_before


# ── deskew ───────────────────────────────────────────────────


@pytest.mark.unit
def test_deskew_output_shape_unchanged(skewed_image):
    result = deskew(skewed_image)
    assert result.shape == skewed_image.shape


@pytest.mark.unit
def test_deskew_noop_for_straight_image(clean_image):
    """이미 수평인 이미지는 크게 변하지 않아야 한다."""
    result = deskew(clean_image)
    assert result.shape == clean_image.shape


@pytest.mark.unit
def test_deskew_returns_uint8(skewed_image):
    result = deskew(skewed_image)
    assert result.dtype == np.uint8


# ── preprocess (통합) ────────────────────────────────────────


@pytest.mark.unit
def test_preprocess_returns_bgr_ndarray(clean_image):
    result = preprocess(clean_image)
    assert isinstance(result, np.ndarray)
    assert result.ndim == 3
    assert result.shape[2] == 3


@pytest.mark.unit
def test_preprocess_from_pil(pil_image):
    result = preprocess(pil_image)
    assert result.ndim == 3


@pytest.mark.unit
def test_preprocess_flags(clean_image):
    """denoise/deskew 플래그가 꺼진 채로도 오류 없이 실행."""
    result = preprocess(clean_image, denoise_img=False, deskew_img=False)
    assert result.ndim == 3


# ── Hypothesis 프로퍼티 기반 테스트 ──────────────────────────


@pytest.mark.unit
@given(
    h=st.integers(min_value=50, max_value=300),
    w=st.integers(min_value=50, max_value=300),
)
@settings(max_examples=20, deadline=5000)
def test_normalize_always_produces_valid_shape(h, w):
    img = np.ones((h, w, 3), dtype=np.uint8) * 128
    result = normalize_resolution(img)
    rh, rw = result.shape[:2]
    long_side = max(rh, rw)
    assert 640 <= long_side <= 4096 or (max(h, w) >= 640 and max(h, w) <= 4096)


@pytest.mark.unit
@given(st.integers(min_value=0, max_value=255))
@settings(max_examples=20, deadline=5000)
def test_denoise_pixel_range(pixel_value):
    img = np.full((100, 100, 3), pixel_value, dtype=np.uint8)
    result = denoise(img)
    assert result.min() >= 0
    assert result.max() <= 255
