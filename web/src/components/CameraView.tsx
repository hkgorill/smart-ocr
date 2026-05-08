import type React from 'react'
import { useCamera } from '../hooks/useCamera'
import type { OCRBlock } from '../types/ocr'

interface Props {
  apiKey?: string
  onResults?: (blocks: OCRBlock[]) => void
}

export function CameraView({ apiKey = '', onResults }: Props) {
  const { videoRef, streamResults, isStreaming, cameraError, startCamera, stopCamera } =
    useCamera(apiKey)

  return (
    <div data-testid="camera-view">
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          data-testid="camera-video"
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            maxWidth: 640,
            borderRadius: 8,
            background: '#111',
            display: 'block',
          }}
        />
        {/* 실시간 결과 오버레이 */}
        {streamResults.length > 0 && (
          <div
            data-testid="stream-overlay"
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              right: 8,
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 13,
              maxHeight: 100,
              overflowY: 'auto',
            }}
          >
            {streamResults.map((b, i) => (
              <div key={i}>{b.text}</div>
            ))}
          </div>
        )}
      </div>

      {cameraError && (
        <p data-testid="camera-error" style={{ color: '#ef4444', marginTop: 8 }}>
          {cameraError}
        </p>
      )}

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        {!isStreaming ? (
          <button
            data-testid="start-camera"
            onClick={startCamera}
            style={{ padding: '8px 20px', borderRadius: 6, cursor: 'pointer' }}
          >
            카메라 시작
          </button>
        ) : (
          <button
            data-testid="stop-camera"
            onClick={stopCamera}
            style={{ padding: '8px 20px', borderRadius: 6, cursor: 'pointer', background: '#ef4444', color: '#fff', border: 'none' }}
          >
            중지
          </button>
        )}
      </div>

      {/* 최신 인식 결과 전달 */}
      {onResults && streamResults.length > 0 && (onResults(streamResults), null)}
    </div>
  )
}
