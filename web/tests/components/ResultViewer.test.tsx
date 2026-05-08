import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ResultViewer } from '../../src/components/ResultViewer'
import type { OCRBlock } from '../../src/types/ocr'

const BLOCKS: OCRBlock[] = [
  { text: '테스트', confidence: 0.99, bbox: [[10, 10], [100, 10], [100, 40], [10, 40]] },
]

describe('ResultViewer', () => {
  it('imageUrl이 없으면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<ResultViewer imageUrl={null} blocks={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('imageUrl이 있으면 canvas가 렌더링된다', () => {
    render(<ResultViewer imageUrl="blob:mock-url" blocks={BLOCKS} />)
    expect(screen.getByTestId('result-canvas')).toBeInTheDocument()
  })

  it('result-viewer 컨테이너가 렌더링된다', () => {
    render(<ResultViewer imageUrl="blob:mock-url" blocks={BLOCKS} />)
    expect(screen.getByTestId('result-viewer')).toBeInTheDocument()
  })

  it('빈 블록 배열로도 오류 없이 렌더링된다', () => {
    expect(() =>
      render(<ResultViewer imageUrl="blob:mock-url" blocks={[]} />)
    ).not.toThrow()
  })
})
