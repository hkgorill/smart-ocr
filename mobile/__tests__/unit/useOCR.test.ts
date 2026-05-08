import { renderHook, act } from '@testing-library/react-native'
import { useOCR } from '../../src/hooks/useOCR'
import * as ocrService from '../../src/services/ocrService'

jest.mock('../../src/services/ocrService')
const mockRecognizeImage = ocrService.recognizeImage as jest.MockedFunction<typeof ocrService.recognizeImage>

const mockResult = {
  blocks: [{ text: '테스트', confidence: 0.9, bbox: { x: 0, y: 0, width: 50, height: 20 } }],
  plainText: '테스트',
  processedAt: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  mockRecognizeImage.mockReset()
})

describe('useOCR', () => {
  it('초기 상태는 idle이다', () => {
    const { result } = renderHook(() => useOCR())
    expect(result.current.status).toBe('idle')
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('OCR 성공 시 status가 success로 변경된다', async () => {
    mockRecognizeImage.mockResolvedValue(mockResult)
    const { result } = renderHook(() => useOCR())

    await act(async () => {
      await result.current.recognize('file:///test.jpg')
    })

    expect(result.current.status).toBe('success')
    expect(result.current.result).toEqual(mockResult)
    expect(result.current.error).toBeNull()
  })

  it('OCR 실패 시 status가 error로 변경된다', async () => {
    mockRecognizeImage.mockRejectedValue(new Error('API 오류'))
    const { result } = renderHook(() => useOCR())

    await act(async () => {
      await result.current.recognize('file:///test.jpg')
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('API 오류')
    expect(result.current.result).toBeNull()
  })

  it('처리 중에는 status가 processing이다', async () => {
    let resolveOCR: (v: typeof mockResult) => void
    mockRecognizeImage.mockReturnValue(new Promise((res) => { resolveOCR = res }))

    const { result } = renderHook(() => useOCR())

    act(() => {
      result.current.recognize('file:///test.jpg')
    })

    expect(result.current.status).toBe('processing')

    await act(async () => {
      resolveOCR!(mockResult)
    })
  })

  it('reset 호출 시 초기 상태로 돌아간다', async () => {
    mockRecognizeImage.mockResolvedValue(mockResult)
    const { result } = renderHook(() => useOCR())

    await act(async () => {
      await result.current.recognize('file:///test.jpg')
    })
    act(() => { result.current.reset() })

    expect(result.current.status).toBe('idle')
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('Error가 아닌 예외는 기본 메시지를 표시한다', async () => {
    mockRecognizeImage.mockRejectedValue('string error')
    const { result } = renderHook(() => useOCR())

    await act(async () => {
      await result.current.recognize('file:///test.jpg')
    })

    expect(result.current.error).toBe('OCR 처리 중 오류가 발생했습니다')
  })
})
