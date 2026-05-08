import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TextEditor } from '../../src/components/TextEditor'
import type { OCRBlock } from '../../src/types/ocr'

const BBOX = [[0, 0], [100, 0], [100, 30], [0, 30]]
const blocks: OCRBlock[] = [
  { text: '첫 번째 줄', confidence: 0.99, bbox: BBOX },
  { text: '두 번째 줄', confidence: 0.95, bbox: BBOX },
]

describe('TextEditor', () => {
  it('블록이 없으면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<TextEditor blocks={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('블록의 텍스트가 textarea에 표시된다', () => {
    render(<TextEditor blocks={blocks} />)
    const ta = screen.getByTestId('result-textarea') as HTMLTextAreaElement
    expect(ta.value).toContain('첫 번째 줄')
    expect(ta.value).toContain('두 번째 줄')
  })

  it('사용자가 텍스트를 편집할 수 있다', async () => {
    render(<TextEditor blocks={blocks} />)
    const ta = screen.getByTestId('result-textarea')
    await userEvent.clear(ta)
    await userEvent.type(ta, '수정된 텍스트')
    expect((ta as HTMLTextAreaElement).value).toBe('수정된 텍스트')
  })

  it('복사 버튼 클릭 시 clipboard.writeText가 호출된다', async () => {
    render(<TextEditor blocks={blocks} />)
    await userEvent.click(screen.getByTestId('copy-btn'))
    expect(navigator.clipboard.writeText).toHaveBeenCalled()
  })

  it('복사 후 버튼 텍스트가 "✓ 복사됨"으로 변경된다', async () => {
    render(<TextEditor blocks={blocks} />)
    await userEvent.click(screen.getByTestId('copy-btn'))
    expect(screen.getByTestId('copy-btn')).toHaveTextContent('✓ 복사됨')
  })

  it('다운로드 버튼이 렌더링된다', () => {
    render(<TextEditor blocks={blocks} />)
    expect(screen.getByTestId('download-btn')).toBeInTheDocument()
  })
})
