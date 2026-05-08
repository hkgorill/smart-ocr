import type { BatchResponse, OCRResponse, TaskStatus } from '../types/ocr'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const API_KEY  = import.meta.env.VITE_API_KEY  ?? ''

function headers(): HeadersInit {
  return { 'X-API-Key': API_KEY }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function analyzeImage(file: File): Promise<OCRResponse> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE_URL}/api/v1/ocr/image`, {
    method: 'POST',
    headers: headers(),
    body: form,
  })
  return handleResponse<OCRResponse>(res)
}

export async function submitBatch(files: File[]): Promise<BatchResponse> {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  const res = await fetch(`${BASE_URL}/api/v1/ocr/batch`, {
    method: 'POST',
    headers: headers(),
    body: form,
  })
  return handleResponse<BatchResponse>(res)
}

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const res = await fetch(`${BASE_URL}/api/v1/tasks/${taskId}`, {
    headers: headers(),
  })
  return handleResponse<TaskStatus>(res)
}

export function createStreamSocket(
  apiKey: string,
  baseUrl: string = BASE_URL,
): WebSocket {
  const wsBase = baseUrl.replace(/^http/, 'ws')
  return new WebSocket(`${wsBase}/api/v1/ocr/stream?api_key=${apiKey}`)
}
