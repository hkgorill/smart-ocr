"""공통 pytest fixture."""

from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
import pytest
from PIL import Image, ImageDraw, ImageFont

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def _make_text_image(text: str, size: tuple[int, int] = (400, 100),
                     bg: int = 255, fg: int = 0) -> np.ndarray:
    """PIL 로 텍스트가 그려진 BGR 이미지를 생성 (테스트용)."""
    img = Image.new("RGB", size, color=(bg, bg, bg))
    draw = ImageDraw.Draw(img)
    draw.text((10, 10), text, fill=(fg, fg, fg))
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)


@pytest.fixture(scope="session")
def clean_image() -> np.ndarray:
    """노이즈 없는 깨끗한 흰 배경 영어 텍스트 이미지.

    너비 800px → long side=800, MIN_LONG_SIDE(640)~MAX_LONG_SIDE(4096) 범위이므로
    normalize_resolution() 이 크기를 변경하지 않는다.
    """
    return _make_text_image("Hello OCR World", size=(800, 150))


@pytest.fixture(scope="session")
def noisy_image(clean_image) -> np.ndarray:
    """가우시안 노이즈가 추가된 이미지."""
    noise = np.random.normal(0, 25, clean_image.shape).astype(np.int16)
    noisy = np.clip(clean_image.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return noisy


@pytest.fixture(scope="session")
def skewed_image(clean_image) -> np.ndarray:
    """5도 기울어진 이미지."""
    h, w = clean_image.shape[:2]
    M = cv2.getRotationMatrix2D((w // 2, h // 2), 5, 1.0)
    return cv2.warpAffine(clean_image, M, (w, h), borderValue=(255, 255, 255))


@pytest.fixture(scope="session")
def gray_image(clean_image) -> np.ndarray:
    """그레이스케일 이미지."""
    return cv2.cvtColor(clean_image, cv2.COLOR_BGR2GRAY)


@pytest.fixture(scope="session")
def rgba_image(clean_image) -> np.ndarray:
    """RGBA 4채널 이미지."""
    return cv2.cvtColor(clean_image, cv2.COLOR_BGR2BGRA)


@pytest.fixture(scope="session")
def small_image() -> np.ndarray:
    """최소 해상도 기준 이하의 작은 이미지 (200×50)."""
    return _make_text_image("small", size=(200, 50))


@pytest.fixture(scope="session")
def large_image() -> np.ndarray:
    """최대 해상도 기준 초과 이미지 (5000×1000)."""
    return _make_text_image("large image text", size=(5000, 1000))


@pytest.fixture(scope="session")
def pil_image(clean_image) -> Image.Image:
    """PIL Image 형식."""
    return Image.fromarray(cv2.cvtColor(clean_image, cv2.COLOR_BGR2RGB))
