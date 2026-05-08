import { recognizeImage, checkHealth } from '../../src/services/ocrService'

const mockFetch = jest.fn()
global.fetch = mockFetch

const mockOCRResponse = {
  blocks: [
    { text: '안녕하세요', confidence: 0.95, bbox: { x: 0, y: 0, width: 100, height: 30 } },
  ],
  plain_text: '안녕하세요',
  processed_at: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe('recognizeImage', () => {
  it('이미지 URI를 API에 전송하고 결과를 반환한다', async () => {
    mockFetch
      .mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob(['img'])) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOCRResponse),
      })

    const result = await recognizeImage('file:///test.jpg')

    expect(result.plainText).toBe('안녕하세요')
    expect(result.blocks).toHaveLength(1)
    expect(result.blocks[0].text).toBe('안녕하세요')
    expect(result.blocks[0].confidence).toBe(0.95)
  })

  it('API 오류 시 Error를 throw한다', async () => {
    mockFetch
      .mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob(['img'])) })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ detail: '파일 형식 오류' }),
      })

    await expect(recognizeImage('file:///bad.jpg')).rejects.toThrow('파일 형식 오류')
  })

  it('언어 옵션을 FormData에 포함한다', async () => {
    mockFetch
      .mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob(['img'])) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ blocks: [], plain_text: '', processed_at: '' }),
      })

    await recognizeImage('file:///test.jpg', { language: 'en' })

    const [, options] = mockFetch.mock.calls[1]
    const body = options.body as FormData
    expect(body).toBeInstanceOf(FormData)
  })

  it('응답에 processed_at 없으면 현재 시간으로 대체한다', async () => {
    mockFetch
      .mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob(['img'])) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ blocks: [], plain_text: 'text' }),
      })

    const result = await recognizeImage('file:///test.jpg')
    expect(result.processedAt).toBeTruthy()
  })
})

describe('checkHealth', () => {
  it('서버 정상 시 true를 반환한다', async () => {
    mockFetch.mockResolvedValue({ ok: true })
    expect(await checkHealth()).toBe(true)
  })

  it('서버 오류 시 false를 반환한다', async () => {
    mockFetch.mockResolvedValue({ ok: false })
    expect(await checkHealth()).toBe(false)
  })

  it('네트워크 오류 시 false를 반환한다', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    expect(await checkHealth()).toBe(false)
  })
})
