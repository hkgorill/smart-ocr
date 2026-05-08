import { useCallback, useEffect, useRef, useState } from 'react'
import { createStreamSocket } from '../api/ocrClient'
import type { OCRBlock } from '../types/ocr'

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>
  streamResults: OCRBlock[]
  isStreaming: boolean
  cameraError: string | null
  startCamera: () => Promise<void>
  stopCamera: () => void
}

export function useCamera(apiKey: string = ''): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [streamResults, setStreamResults] = useState<OCRBlock[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    socketRef.current?.close()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    intervalRef.current = null
    socketRef.current = null
    streamRef.current = null
    setIsStreaming(false)
    setStreamResults([])
  }, [])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }

      const ws = createStreamSocket(apiKey)
      socketRef.current = ws

      ws.onmessage = (ev) => {
        const data = JSON.parse(ev.data)
        if (data.status === 'ok') setStreamResults(data.result ?? [])
      }
      ws.onerror = () => setCameraError('스트림 연결 오류')

      // 500ms마다 프레임 전송
      ws.onopen = () => {
        setIsStreaming(true)
        intervalRef.current = setInterval(() => {
          if (!videoRef.current || ws.readyState !== WebSocket.OPEN) return
          const canvas = document.createElement('canvas')
          canvas.width = videoRef.current.videoWidth || 320
          canvas.height = videoRef.current.videoHeight || 240
          canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
          canvas.toBlob((blob) => {
            if (blob) ws.send(blob)
          }, 'image/jpeg', 0.7)
        }, 500)
      }
    } catch {
      setCameraError('카메라 접근 권한이 필요합니다.')
    }
  }, [apiKey])

  useEffect(() => () => stopCamera(), [stopCamera])

  return { videoRef, streamResults, isStreaming, cameraError, startCamera, stopCamera }
}
