import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8000'

const MOCK_BLOCK = {
  text: '테스트 문자',
  confidence: 0.99,
  bbox: [[10, 10], [200, 10], [200, 40], [10, 40]],
}

export const handlers = [
  http.post(`${BASE}/api/v1/ocr/image`, () =>
    HttpResponse.json({
      task_id: 'mock-task-id',
      status: 'done',
      result: [MOCK_BLOCK],
      plain_text: '테스트 문자',
    })
  ),

  http.post(`${BASE}/api/v1/ocr/batch`, () =>
    HttpResponse.json({
      task_id: 'mock-batch-id',
      status: 'pending',
      message: '배치 작업이 접수되었습니다.',
    })
  ),

  http.get(`${BASE}/api/v1/tasks/:taskId`, () =>
    HttpResponse.json({
      task_id: 'mock-batch-id',
      status: 'done',
      result: [[MOCK_BLOCK]],
    })
  ),
]

export const errorHandler = http.post(`${BASE}/api/v1/ocr/image`, () =>
  HttpResponse.json({ detail: '서버 오류' }, { status: 500 })
)
