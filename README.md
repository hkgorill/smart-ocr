# SmartOCR

사진 또는 카메라 영상에서 문자를 추출하는 OCR 플랫폼입니다.  
**PaddleOCR PP-OCRv4** 모델을 기반으로 한국어·영어를 CPU 환경에서 인식하며,  
REST API · 웹 앱 · 모바일 앱으로 구성된 4계층 아키텍처로 구현되어 있습니다.

모든 의존 라이브러리는 **MIT / Apache 2.0 / BSD** 라이선스만 사용하여 상용화가 가능합니다.

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│  Web App (React + Vite)   Mobile App (React Native)    │
│       web/                        mobile/               │
└───────────────────┬─────────────────────────────────────┘
                    │  HTTP / WebSocket
┌───────────────────▼─────────────────────────────────────┐
│           REST API Server (FastAPI)                      │
│                    api/                                  │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│           OCR Core (PaddleOCR + OpenCV)                  │
│                    core/                                 │
└─────────────────────────────────────────────────────────┘
```

| 계층 | 기술 스택 |
|------|-----------|
| OCR Core | PaddleOCR 2.8.1 (PP-OCRv4 Mobile), OpenCV 4.10, NumPy 1.26 |
| API Server | FastAPI 0.115.5, Uvicorn, Pydantic-settings |
| Web App | React 18, Vite, TypeScript, MSW (테스트) |
| Mobile App | React Native 0.74, react-native-vision-camera, Jest |

---

## 디렉터리 구조

```
smart-ocr/
├── core/                   # Phase 1 — OCR 코어
│   ├── preprocessor.py     # 이미지 전처리 (해상도 정규화, 노이즈 제거, 기울기 보정)
│   ├── engine.py           # PaddleOCR 래퍼 (싱글턴 캐시)
│   ├── postprocessor.py    # 결과 정렬·필터링·정제
│   └── pipeline.py         # 전체 파이프라인 (단건·배치·JSON)
│
├── api/                    # Phase 2 — REST API
│   ├── main.py             # FastAPI 앱 진입점
│   ├── config.py           # 환경변수 설정 (pydantic-settings)
│   ├── deps.py             # API Key 인증 의존성
│   ├── routers/ocr.py      # /api/v1/ocr/* 엔드포인트
│   ├── schemas/ocr.py      # 요청/응답 스키마
│   ├── services/           # 파이프라인 의존성 주입
│   └── tasks/store.py      # 인메모리 비동기 작업 저장소
│
├── web/                    # Phase 3 — 웹 앱
│   ├── src/
│   │   ├── pages/          # UploadPage, CameraPage
│   │   ├── components/     # ImageDropzone, CameraView, ResultViewer, TextEditor
│   │   ├── hooks/          # useOCR, useCamera
│   │   └── api/ocrClient   # fetch 기반 API 클라이언트
│   └── tests/              # Vitest 단위·컴포넌트 테스트, Playwright E2E
│
├── mobile/                 # Phase 4 — 모바일 앱
│   ├── src/
│   │   ├── screens/        # HomeScreen, CameraScreen, GalleryScreen, ResultScreen
│   │   ├── components/     # ResultCard
│   │   ├── hooks/useOCR    # OCR 상태 관리
│   │   ├── services/       # API 호출 (fetch + FormData)
│   │   └── store/          # AsyncStorage 기반 히스토리
│   └── __tests__/          # Jest 단위·컴포넌트 테스트
│
├── tests/                  # Python 테스트 (unit + integration + api)
├── docker/                 # Dockerfile, docker-compose.yml
├── scripts/run_tests.sh    # 전체 테스트 실행 스크립트
└── requirements.txt
```

---

## 빠른 시작

### 사전 요구사항

- Python 3.11+
- Node.js 20+
- (선택) Docker

### 1. OCR Core + API 서버

```bash
# 가상환경 생성 및 패키지 설치
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일에서 SMARTOCR_API_KEY 값 변경

# API 서버 실행
uvicorn api.main:app --reload --port 8000
```

Swagger UI: http://localhost:8000/docs

### 2. 웹 앱

```bash
cd web
npm install
npm run dev       # http://localhost:5173
```

> API 서버가 먼저 실행되어 있어야 OCR 기능이 동작합니다.

### 3. Docker (API 서버)

```bash
cp .env.example .env
docker compose -f docker/docker-compose.yml up --build
```

---

## API 엔드포인트

모든 요청에 `X-API-Key` 헤더가 필요합니다.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | 서버 상태 확인 |
| POST | `/api/v1/ocr/image` | 이미지 단건 OCR (동기) |
| POST | `/api/v1/ocr/batch` | 이미지 배치 OCR (비동기) |
| GET | `/api/v1/tasks/{task_id}` | 배치 작업 상태 조회 |
| WS | `/api/v1/ocr/stream` | WebSocket 실시간 스트림 OCR |

### 예시 — 이미지 OCR

```bash
curl -X POST http://localhost:8000/api/v1/ocr/image \
  -H "X-API-Key: dev-secret-key" \
  -F "file=@sample.jpg"
```

```json
{
  "blocks": [
    {
      "text": "안녕하세요",
      "confidence": 0.97,
      "bbox": {"x": 12, "y": 8, "width": 140, "height": 32}
    }
  ],
  "plain_text": "안녕하세요",
  "processed_at": "2024-01-01T12:00:00"
}
```

---

## 환경변수

`.env.example`을 복사하여 `.env`로 사용합니다.

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `SMARTOCR_API_KEY` | `dev-secret-key` | API 인증 키 |
| `SMARTOCR_RATE_LIMIT` | `60/minute` | IP당 요청 제한 |
| `SMARTOCR_OCR_LANG` | `ko` | OCR 언어 (`ko`, `en`, `ko+en`) |
| `SMARTOCR_MAX_FILE_SIZE_MB` | `10` | 업로드 최대 파일 크기 |

---

## 테스트

### Python (Phase 1·2)

```bash
source .venv/bin/activate
pytest --cov=core --cov=api --cov-report=term-missing
```

### 웹 (Phase 3)

```bash
cd web
npm run test:coverage    # Vitest 단위·컴포넌트 테스트
npm run test:e2e         # Playwright E2E (서버 필요)
```

### 모바일 (Phase 4)

```bash
cd mobile
npm install
npm run test:coverage    # Jest 단위·컴포넌트 테스트
```

### 전체 테스트

```bash
bash scripts/run_tests.sh
```

### 커버리지 목표

| Phase | 대상 | 목표 |
|-------|------|------|
| Phase 1 — OCR Core | Lines | ≥ 90% |
| Phase 2 — API | Lines | ≥ 85% |
| Phase 3 — Web | Lines | ≥ 80% |
| Phase 4 — Mobile | Lines | ≥ 80% |

---

## 라이선스

이 프로젝트의 소스코드는 **MIT License**로 배포됩니다.

사용된 주요 오픈소스 라이브러리:

| 라이브러리 | 라이선스 |
|-----------|---------|
| PaddleOCR / PaddlePaddle | Apache 2.0 |
| OpenCV (headless) | Apache 2.0 |
| FastAPI | MIT |
| React / React Native | MIT |
| Uvicorn | BSD |
