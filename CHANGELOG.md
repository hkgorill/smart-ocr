# Changelog

## [Unreleased] - 2026-05-16

### 추가
- **이중 OCR 엔진 지원**: EasyOCR과 PaddleOCR을 동시에 유지하며 상황에 맞게 선택 가능
  - API 요청 시 `?engine=easyocr` 또는 `?engine=paddle` 쿼리 파라미터로 per-request 선택
  - `.env`의 `SMARTOCR_OCR_ENGINE` 으로 서버 기본 엔진 설정
- **`api/config.py`**: `ocr_engine` 설정 항목 추가 (기본값: `easyocr`)
- **`requirements.txt`**: `easyocr`, `paddlepaddle>=3.0.0`, `paddleocr>=2.8.1` 추가

### 변경
- **`core/engine.py`**: PaddleOCR 단일 엔진 → `OCREngine` 추상 클래스 + `_EasyOCREngine` / `_PaddleEngine` 구현체로 리팩토링
- **`core/pipeline.py`**: `engine_type` 파라미터 추가; CLI `--engine` 옵션 추가
- **`api/services/ocr_service.py`**: `get_pipeline(engine=None)` — 요청별 엔진 override 지원
- **`api/routers/ocr.py`**: `POST /api/v1/ocr/image` 에 `engine` 쿼리 파라미터 추가

### 수정
- **`core/preprocessor.py`**: `deskew()` 보정 각도를 ±10° 이내로 제한 — UI 스크린샷 등에서 오감지로 이미지가 90° 회전되던 버그 수정
- **`core/postprocessor.py`**: confidence threshold 기본값 `0.5` → `0.3` 으로 완화
- **`core/pipeline.py`**: `denoise_img` 기본값 `True` → `False` — 디지털 이미지에서 노이즈 제거가 오히려 텍스트를 뭉개는 문제 수정
- **`paddlepaddle`**: `2.6.2` → `3.0.0` 업그레이드 — WSL2 환경 AVX-512 SIGILL 크래시 해결

---

### 엔진 선택 가이드

| 상황 | 권장 엔진 |
|------|-----------|
| 한국어 / 한영 혼합 문서 | `easyocr` |
| 중국어 포함 문서 | `paddle` (`ch` 언어) |
| 고속 처리가 필요한 배치 작업 | `paddle` |
| 일반 스크린샷 / 메모 인식 | `easyocr` |
