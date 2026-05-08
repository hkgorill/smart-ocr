import { OCRResult, OCROptions } from '../types/ocr'

const API_BASE_URL = 'http://localhost:8000'
const API_KEY = 'dev-secret-key'

async function imageUriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri)
  return response.blob()
}

export async function recognizeImage(
  imageUri: string,
  options: Partial<OCROptions> = {}
): Promise<OCRResult> {
  const blob = await imageUriToBlob(imageUri)
  const formData = new FormData()
  formData.append('file', blob as unknown as File, 'image.jpg')
  if (options.language) {
    formData.append('lang', options.language)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/ocr/image`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail ?? `HTTP ${response.status}`)
  }

  const data = await response.json()
  return {
    blocks: data.blocks ?? [],
    plainText: data.plain_text ?? '',
    processedAt: data.processed_at ?? new Date().toISOString(),
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' })
    return response.ok
  } catch {
    return false
  }
}
