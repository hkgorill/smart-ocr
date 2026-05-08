import { useEffect, useRef } from 'react'
import type { OCRBlock } from '../types/ocr'

interface Props {
  imageUrl: string | null
  blocks: OCRBlock[]
}

export function ResultViewer({ imageUrl, blocks }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageUrl) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      ctx.strokeStyle = '#4f46e5'
      ctx.lineWidth = 2
      ctx.font = '14px sans-serif'
      ctx.fillStyle = 'rgba(79,70,229,0.15)'

      blocks.forEach((block) => {
        const [[x1, y1], [x2,], , [, y3]] = block.bbox
        const w = x2 - x1
        const h = y3 - y1
        ctx.beginPath()
        ctx.rect(x1, y1, w, h)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = '#4f46e5'
        ctx.fillText(
          `${Math.round(block.confidence * 100)}%`,
          x1 + 2,
          y1 > 14 ? y1 - 2 : y1 + 14,
        )
        ctx.fillStyle = 'rgba(79,70,229,0.15)'
      })
    }
    img.src = imageUrl
  }, [imageUrl, blocks])

  if (!imageUrl) return null

  return (
    <div data-testid="result-viewer">
      <canvas
        ref={canvasRef}
        data-testid="result-canvas"
        style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }}
      />
    </div>
  )
}
