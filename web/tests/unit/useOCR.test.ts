import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useOCR } from '../../src/hooks/useOCR'
import { server } from '../mocks/server'
import { errorHandler } from '../mocks/handlers'

describe('useOCR', () => {
  it('초기 상태가 올바르다', () => {
    const { result } = renderHook(() => useOCR())
    expect(result.current.results).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('analyze 호출 중 loading이 true가 된다', async () => {
    const { result } = renderHook(() => useOCR())
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })

    act(() => { result.current.analyze(file) })
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('성공 시 results에 OCR 블록이 채워진다', async () => {
    const { result } = renderHook(() => useOCR())
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => { await result.current.analyze(file) })

    expect(result.current.results).toHaveLength(1)
    expect(result.current.results[0].text).toBe('테스트 문자')
    expect(result.current.error).toBeNull()
  })

  it('서버 오류 시 error가 설정되고 results는 빈 배열이다', async () => {
    server.use(errorHandler)
    const { result } = renderHook(() => useOCR())
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => { await result.current.analyze(file) })

    expect(result.current.error).not.toBeNull()
    expect(result.current.results).toEqual([])
  })

  it('reset 호출 시 results와 error가 초기화된다', async () => {
    const { result } = renderHook(() => useOCR())
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })
    await act(async () => { await result.current.analyze(file) })
    expect(result.current.results).toHaveLength(1)

    act(() => { result.current.reset() })
    expect(result.current.results).toEqual([])
    expect(result.current.error).toBeNull()
  })
})
