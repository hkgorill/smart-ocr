"""OCR 파이프라인 — 전처리 → 추론 → 후처리 통합."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Union

import numpy as np
from PIL import Image

from .engine import OCREngine
from .postprocessor import postprocess, to_plain_text
from .preprocessor import preprocess


ImageSource = Union[str, Path, np.ndarray, Image.Image]


class OCRPipeline:
    """OCR 전체 파이프라인.

    Usage:
        pipeline = OCRPipeline(lang="ko")
        results = pipeline.run("photo.jpg")
        print(pipeline.run_text("photo.jpg"))
    """

    def __init__(
        self,
        lang: str = "ko",
        engine_type: str = "easyocr",
        use_gpu: bool = False,
        confidence_threshold: float = 0.3,
        denoise_img: bool = False,
        deskew_img: bool = True,
    ) -> None:
        self._engine = OCREngine.get(engine_type=engine_type, lang=lang, use_gpu=use_gpu)
        self._conf_threshold = confidence_threshold
        self._denoise = denoise_img
        self._deskew = deskew_img

    def run(self, source: ImageSource) -> list[dict]:
        """이미지 소스를 받아 OCR 결과 블록 리스트 반환.

        Returns:
            [{"text": str, "confidence": float, "bbox": [[x,y], ...]}]
        """
        img = preprocess(source, denoise_img=self._denoise, deskew_img=self._deskew)
        raw_blocks = self._engine.recognize(img)
        return postprocess(raw_blocks, confidence_threshold=self._conf_threshold)

    def run_text(self, source: ImageSource) -> str:
        """인식된 텍스트를 줄 구분 문자열로 반환."""
        return to_plain_text(self.run(source))

    def run_batch(self, sources: list[ImageSource]) -> list[list[dict]]:
        """복수 이미지를 순차 처리해 결과 리스트 반환."""
        return [self.run(src) for src in sources]

    def run_json(self, source: ImageSource, indent: int = 2) -> str:
        """OCR 결과를 JSON 문자열로 반환."""
        return json.dumps(self.run(source), ensure_ascii=False, indent=indent)


def main() -> None:  # pragma: no cover
    """CLI 진입점: python -m core.pipeline --input <image>"""
    import argparse

    parser = argparse.ArgumentParser(description="SmartOCR CLI")
    parser.add_argument("--input", required=True, help="이미지 파일 경로")
    parser.add_argument("--lang", default="ko", choices=["ko", "en", "ch"],
                        help="인식 언어 (기본: ko)")
    parser.add_argument("--engine", default="easyocr", choices=["easyocr", "paddle"],
                        help="OCR 엔진 (기본: easyocr)")
    parser.add_argument("--json", action="store_true", help="JSON 형식으로 출력")
    parser.add_argument("--no-denoise", action="store_true")
    parser.add_argument("--no-deskew", action="store_true")
    args = parser.parse_args()

    pipeline = OCRPipeline(
        lang=args.lang,
        engine_type=args.engine,
        denoise_img=not args.no_denoise,
        deskew_img=not args.no_deskew,
    )

    if args.json:
        print(pipeline.run_json(args.input))
    else:
        print(pipeline.run_text(args.input))


if __name__ == "__main__":  # pragma: no cover
    main()
