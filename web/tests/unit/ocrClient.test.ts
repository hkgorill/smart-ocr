import { describe, expect, it } from 'vitest'
import { analyzeImage, getTaskStatus, submitBatch } from '../../src/api/ocrClient'

describe('ocrClient', () => {
  it('analyzeImage가 OCRResponse를 반환한다', async () => {
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })
    const result = await analyzeImage(file)
    expect(result.status).toBe('done')
    expect(result.result).toHaveLength(1)
    expect(result.plain_text).toBe('테스트 문자')
  })

  it('submitBatch가 BatchResponse를 반환한다', async () => {
    const files = [new File(['a'], 'a.jpg', { type: 'image/jpeg' })]
    const result = await submitBatch(files)
    expect(result.status).toBe('pending')
    expect(result.task_id).toBeDefined()
  })

  it('getTaskStatus가 TaskStatus를 반환한다', async () => {
    const result = await getTaskStatus('mock-batch-id')
    expect(result.status).toBe('done')
  })
})
