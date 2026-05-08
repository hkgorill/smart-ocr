import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { ResultCard } from '../../src/components/ResultCard'
import { OCRBlock } from '../../src/types/ocr'

function makeBlock(overrides: Partial<OCRBlock> = {}): OCRBlock {
  return {
    text: '테스트 텍스트',
    confidence: 0.92,
    bbox: { x: 0, y: 0, width: 100, height: 30 },
    ...overrides,
  }
}

function getColor(el: ReturnType<typeof screen.getByTestId>): string {
  const style = el.props.style
  const arr: Array<Record<string, unknown>> = Array.isArray(style) ? style : [style]
  const found = arr.find((s) => s && 'color' in s)
  return (found?.color as string) ?? ''
}

describe('ResultCard', () => {
  it('텍스트가 렌더링된다', () => {
    render(<ResultCard block={makeBlock()} />)
    expect(screen.getByTestId('block-text')).toHaveTextContent('테스트 텍스트')
  })

  it('신뢰도가 퍼센트로 표시된다', () => {
    render(<ResultCard block={makeBlock({ confidence: 0.92 })} />)
    expect(screen.getByTestId('block-confidence')).toHaveTextContent('신뢰도: 92%')
  })

  it('신뢰도 80% 이상은 녹색으로 표시된다', () => {
    render(<ResultCard block={makeBlock({ confidence: 0.85 })} />)
    expect(getColor(screen.getByTestId('block-confidence'))).toBe('#059669')
  })

  it('신뢰도 60~80%는 주황색으로 표시된다', () => {
    render(<ResultCard block={makeBlock({ confidence: 0.7 })} />)
    expect(getColor(screen.getByTestId('block-confidence'))).toBe('#D97706')
  })

  it('신뢰도 60% 미만은 빨간색으로 표시된다', () => {
    render(<ResultCard block={makeBlock({ confidence: 0.4 })} />)
    expect(getColor(screen.getByTestId('block-confidence'))).toBe('#DC2626')
  })
})
