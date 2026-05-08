"""이미지 전처리 — 노이즈 제거, 기울기 보정, 해상도 정규화."""

from __future__ import annotations

import cv2
import numpy as np
from PIL import Image


# 최소 긴 변 길이. 이보다 작은 이미지는 업스케일.
_MIN_LONG_SIDE = 640
# 최대 긴 변 길이. 이보다 큰 이미지는 다운스케일.
_MAX_LONG_SIDE = 4096


def load_image(source: str | np.ndarray | Image.Image) -> np.ndarray:
    """파일 경로, NumPy 배열, PIL Image 중 하나를 BGR ndarray로 변환."""
    if isinstance(source, np.ndarray):
        return source.copy()
    if isinstance(source, Image.Image):
        return cv2.cvtColor(np.array(source.convert("RGB")), cv2.COLOR_RGB2BGR)
    img = cv2.imread(source, cv2.IMREAD_COLOR)
    if img is None:
        raise FileNotFoundError(f"이미지를 읽을 수 없습니다: {source}")
    return img


def normalize_resolution(img: np.ndarray) -> np.ndarray:
    """긴 변 기준으로 이미지 크기를 적정 범위로 조정."""
    h, w = img.shape[:2]
    long_side = max(h, w)
    if _MIN_LONG_SIDE <= long_side <= _MAX_LONG_SIDE:
        return img
    scale = _MIN_LONG_SIDE / long_side if long_side < _MIN_LONG_SIDE else _MAX_LONG_SIDE / long_side
    new_w, new_h = round(w * scale), round(h * scale)
    interp = cv2.INTER_CUBIC if scale > 1 else cv2.INTER_AREA
    return cv2.resize(img, (new_w, new_h), interpolation=interp)


def denoise(img: np.ndarray) -> np.ndarray:
    """Non-local Means 디노이징 (컬러 이미지)."""
    return cv2.fastNlMeansDenoisingColored(img, None, h=10, hColor=10,
                                           templateWindowSize=7, searchWindowSize=21)


def deskew(img: np.ndarray) -> np.ndarray:
    """텍스트 기울기를 감지해 수평으로 보정."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Canny → 좌표 추출 → minAreaRect 로 기울기 측정
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    coords = np.column_stack(np.where(edges > 0))
    if len(coords) < 10:
        return img
    angle = cv2.minAreaRect(coords)[-1]
    # minAreaRect 는 -90~0° 범위로 반환; 45° 초과 기울기는 무시
    if angle < -45:
        angle += 90
    if abs(angle) < 0.5:
        return img
    h, w = img.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC,
                          borderMode=cv2.BORDER_REPLICATE)


def to_bgr(img: np.ndarray) -> np.ndarray:
    """그레이스케일·RGBA 이미지를 BGR 3채널로 변환."""
    if img.ndim == 2:
        return cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    if img.shape[2] == 4:
        return cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    return img


def preprocess(source: str | np.ndarray | Image.Image,
               *,
               denoise_img: bool = True,
               deskew_img: bool = True) -> np.ndarray:
    """전처리 파이프라인 진입점.

    Returns:
        BGR ndarray (OCR 엔진에 바로 전달 가능)
    """
    img = load_image(source)
    img = to_bgr(img)
    img = normalize_resolution(img)
    if denoise_img:
        img = denoise(img)
    if deskew_img:
        img = deskew(img)
    return img
