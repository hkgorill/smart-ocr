import { useCallback, useEffect, useState } from 'react'
import type { OCRBlock } from '../types/ocr'

interface Props {
  blocks: OCRBlock[]
}

export function TextEditor({ blocks }: Props) {
  const [text, setText] = useState(() => blocks.map((b) => b.text).join('\n'))
  const [copied, setCopied] = useState(false)

  // blocks가 교체될 때만 텍스트 동기화 (사용자 편집 중에는 유지)
  useEffect(() => {
    setText(blocks.map((b) => b.text).join('\n'))
  }, [blocks])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])

  const handleDownload = useCallback(() => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ocr-result.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [text])

  if (blocks.length === 0) return null

  return (
    <div data-testid="text-editor" style={{ marginTop: 16 }}>
      <textarea
        data-testid="result-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        style={{
          width: '100%',
          fontFamily: 'monospace',
          fontSize: 14,
          padding: 12,
          borderRadius: 8,
          border: '1px solid #d1d5db',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
        aria-label="OCR 인식 결과 텍스트"
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          data-testid="copy-btn"
          onClick={handleCopy}
          style={{ padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}
        >
          {copied ? '✓ 복사됨' : '복사'}
        </button>
        <button
          data-testid="download-btn"
          onClick={handleDownload}
          style={{ padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}
        >
          다운로드
        </button>
      </div>
    </div>
  )
}
