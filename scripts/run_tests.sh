#!/bin/bash
# Phase 1 자체 테스트 실행 스크립트
# 사용법:
#   ./scripts/run_tests.sh              # 단위 + 통합 테스트
#   RUN_ACCURACY=1 ./scripts/run_tests.sh  # 정확도 벤치마크 포함 (모델 필요)

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PYTHON=".venv/bin/python"
PYTEST=".venv/bin/pytest"

echo "================================================"
echo " SmartOCR Phase 1 자체 테스트"
echo "================================================"

echo ""
echo "▶ [1/3] Phase 1 — OCR 코어 (단위 + 통합, 커버리지 ≥ 90%)"
"$PYTEST" tests/unit/ tests/integration/ \
  --cov=core \
  --cov-report=term-missing \
  --cov-fail-under=90

echo ""
echo "▶ [2/3] Phase 2 — API 서버 (API 테스트, 커버리지 ≥ 85%)"
"$PYTEST" tests/api/ \
  --cov=api \
  --cov-report=term-missing \
  --cov-report=html:htmlcov \
  --cov-fail-under=85

if [ "${RUN_ACCURACY:-0}" = "1" ]; then
  echo ""
  echo "▶ [3/3] 정확도 벤치마크"
  "$PYTEST" tests/accuracy/ \
    -m accuracy \
    -v \
    "$@"
else
  echo ""
  echo "  [3/3] 정확도 벤치마크 건너뜀 (RUN_ACCURACY=1 로 활성화)"
fi

echo ""
echo "================================================"
echo " ✅ Phase 1 테스트 완료"
echo " 커버리지 리포트: htmlcov/index.html"
echo "================================================"
