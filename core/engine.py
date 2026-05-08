"""PaddleOCR 추론 엔진 — 싱글턴 패턴으로 모델을 한 번만 로드."""

from __future__ import annotations

import numpy as np
from paddleocr import PaddleOCR

# 지원 언어 코드 → PaddleOCR lang 파라미터
_LANG_MAP: dict[str, str] = {
    "ko": "korean",
    "en": "en",
    "ch": "ch",
}

_instances: dict[str, "OCREngine"] = {}


class OCREngine:
    """PaddleOCR 래퍼.

    동일 언어 조합은 싱글턴으로 재사용해 모델 로딩 비용을 최소화.
    """

    def __init__(self, lang: str = "korean", use_gpu: bool = False) -> None:
        self._ocr = PaddleOCR(
            use_angle_cls=True,
            lang=lang,
            use_gpu=use_gpu,
            show_log=False,
        )
        self.lang = lang

    @classmethod
    def get(cls, lang: str = "ko", use_gpu: bool = False) -> "OCREngine":
        """언어별 싱글턴 인스턴스 반환."""
        paddle_lang = _LANG_MAP.get(lang, lang)
        key = f"{paddle_lang}_{use_gpu}"
        if key not in _instances:
            _instances[key] = cls(lang=paddle_lang, use_gpu=use_gpu)
        return _instances[key]

    def recognize(self, img: np.ndarray) -> list[dict]:
        """BGR ndarray 를 받아 텍스트 블록 리스트를 반환.

        Returns:
            [{"text": str, "confidence": float, "bbox": list[list[int]]}]
        """
        raw = self._ocr.ocr(img, cls=True)
        return self._parse(raw)

    @staticmethod
    def _parse(raw: list | None) -> list[dict]:
        results: list[dict] = []
        if not raw:
            return results
        for page in raw:
            if not page:
                continue
            for item in page:
                if not item or len(item) < 2:
                    continue
                bbox, (text, conf) = item
                # bbox: [[x1,y1],[x2,y2],[x3,y3],[x4,y4]] (float) → int
                bbox_int = [[int(p[0]), int(p[1])] for p in bbox]
                results.append({
                    "text": text,
                    "confidence": round(float(conf), 4),
                    "bbox": bbox_int,
                })
        return results
