import { useState, useCallback } from 'react'
import { OCRResult, OCROptions } from '../types/ocr'
import { recognizeImage } from '../services/ocrService'

type OCRStatus = 'idle' | 'processing' | 'success' | 'error'

export interface UseOCRReturn {
  status: OCRStatus
  result: OCRResult | null
  error: string | null
  recognize: (imageUri: string, options?: Partial<OCROptions>) => Promise<void>
  reset: () => void
}

export function useOCR(): UseOCRReturn {
  const [status, setStatus] = useState<OCRStatus>('idle')
  const [result, setResult] = useState<OCRResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recognize = useCallback(async (imageUri: string, options?: Partial<OCROptions>) => {
    setStatus('processing')
    setError(null)
    try {
      const ocrResult = await recognizeImage(imageUri, options)
      setResult(ocrResult)
      setStatus('success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OCR 처리 중 오류가 발생했습니다'
      setError(message)
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setError(null)
  }, [])

  return { status, result, error, recognize, reset }
}
