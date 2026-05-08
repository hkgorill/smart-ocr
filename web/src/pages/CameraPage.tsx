import { useState } from 'react'
import { CameraView } from '../components/CameraView'
import { TextEditor } from '../components/TextEditor'
import type { OCRBlock } from '../types/ocr'

export function CameraPage() {
  const [latestBlocks, setLatestBlocks] = useState<OCRBlock[]>([])
  const apiKey = import.meta.env.VITE_API_KEY ?? ''

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
        실시간 카메라 OCR
      </h1>

      <CameraView apiKey={apiKey} onResults={setLatestBlocks} />

      {latestBlocks.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            인식 결과
          </h2>
          <TextEditor blocks={latestBlocks} />
        </div>
      )}
    </main>
  )
}
