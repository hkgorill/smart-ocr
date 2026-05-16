"""OCR 추론 엔진 — EasyOCR / PaddleOCR 선택 가능, 싱글턴 캐시."""

from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np

_EASYOCR_LANG_MAP: dict[str, list[str]] = {
    "ko": ["ko", "en"],
    "en": ["en"],
    "ch": ["ch_sim", "en"],
}

_PADDLE_LANG_MAP: dict[str, str] = {
    "ko": "korean",
    "en": "en",
    "ch": "ch",
}

_instances: dict[str, "OCREngine"] = {}


class OCREngine(ABC):
    @abstractmethod
    def recognize(self, img: np.ndarray) -> list[dict]:
        """BGR ndarray 를 받아 텍스트 블록 리스트 반환.

        Returns:
            [{"text": str, "confidence": float, "bbox": list[list[int]]}]
        """

    @staticmethod
    def _bbox_to_int(bbox: list) -> list[list[int]]:
        return [[int(p[0]), int(p[1])] for p in bbox]

    @classmethod
    def get(
        cls,
        engine_type: str = "easyocr",
        lang: str = "ko",
        use_gpu: bool = False,
    ) -> "OCREngine":
        """엔진 타입·언어별 싱글턴 반환."""
        key = f"{engine_type}_{lang}_{use_gpu}"
        if key not in _instances:
            if engine_type == "paddle":
                _instances[key] = _PaddleEngine(lang=lang, use_gpu=use_gpu)
            else:
                _instances[key] = _EasyOCREngine(lang=lang, use_gpu=use_gpu)
        return _instances[key]


class _EasyOCREngine(OCREngine):
    def __init__(self, lang: str = "ko", use_gpu: bool = False) -> None:
        import easyocr
        langs = _EASYOCR_LANG_MAP.get(lang, ["ko", "en"])
        self._reader = easyocr.Reader(langs, gpu=use_gpu)

    def recognize(self, img: np.ndarray) -> list[dict]:
        raw = self._reader.readtext(img)
        return [
            {
                "text": text,
                "confidence": round(float(conf), 4),
                "bbox": self._bbox_to_int(bbox),
            }
            for bbox, text, conf in raw
        ]


class _PaddleEngine(OCREngine):
    def __init__(self, lang: str = "ko", use_gpu: bool = False) -> None:
        from paddleocr import PaddleOCR
        paddle_lang = _PADDLE_LANG_MAP.get(lang, lang)
        self._ocr = PaddleOCR(
            use_angle_cls=True,
            lang=paddle_lang,
            use_gpu=use_gpu,
            show_log=False,
        )

    def recognize(self, img: np.ndarray) -> list[dict]:
        raw = self._ocr.ocr(img, cls=True)
        if not raw:
            return []
        results: list[dict] = []
        for page in raw:
            if not page:
                continue
            for item in page:
                if not item or len(item) < 2:
                    continue
                bbox, (text, conf) = item
                results.append({
                    "text": text,
                    "confidence": round(float(conf), 4),
                    "bbox": self._bbox_to_int(bbox),
                })
        return results
