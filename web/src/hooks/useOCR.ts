import { useCallback, useState } from 'react'
import { analyzeImage } from '../api/ocrClient'
import type { OCRBlock } from '../types/ocr'

export interface UseOCRReturn {
  results: OCRBlock[]
  loading: boolean
  error: string | null
  analyze: (file: File) => Promise<void>
  reset: () => void
}

export function useOCR(): UseOCRReturn {
  const [results, setResults] = useState<OCRBlock[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const response = await analyzeImage(file)
      setResults(response.result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'OCR 처리 중 오류가 발생했습니다.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return { results, loading, error, analyze, reset }
}
