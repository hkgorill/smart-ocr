import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Share } from 'react-native'
import { ResultScreen } from '../../src/screens/ResultScreen'
import { OCRResult } from '../../src/types/ocr'

const mockResult: OCRResult = {
  blocks: [
    { text: '안녕하세요', confidence: 0.95, bbox: { x: 0, y: 0, width: 100, height: 30 } },
    { text: '반갑습니다', confidence: 0.72, bbox: { x: 0, y: 40, width: 100, height: 30 } },
  ],
  plainText: '안녕하세요\n반갑습니다',
  processedAt: '2024-01-01T00:00:00Z',
}

function makeProps(result = mockResult) {
  return {
    route: { params: { imageUri: 'file:///test.jpg', result }, key: 'Result', name: 'Result' },
    navigation: {} as any,
  } as any
}

describe('ResultScreen', () => {
  it('결과 화면이 렌더링된다', () => {
    render(<ResultScreen {...makeProps()} />)
    expect(screen.getByTestId('result-screen')).toBeTruthy()
  })

  it('각 블록의 ResultCard가 렌더링된다', () => {
    render(<ResultScreen {...makeProps()} />)
    expect(screen.getAllByTestId('result-card')).toHaveLength(2)
  })

  it('텍스트 에디터에 plain text가 표시된다', () => {
    render(<ResultScreen {...makeProps()} />)
    const editor = screen.getByTestId('text-editor')
    expect(editor.props.value).toBe('안녕하세요\n반갑습니다')
  })

  it('텍스트를 편집할 수 있다', () => {
    render(<ResultScreen {...makeProps()} />)
    const editor = screen.getByTestId('text-editor')
    fireEvent.changeText(editor, '수정된 텍스트')
    expect(editor.props.value).toBe('수정된 텍스트')
  })

  it('공유 버튼이 Share API를 호출한다', async () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any)
    render(<ResultScreen {...makeProps()} />)
    fireEvent.press(screen.getByTestId('share-button'))
    expect(shareSpy).toHaveBeenCalledWith({ message: '안녕하세요\n반갑습니다' })
    shareSpy.mockRestore()
  })

  it('블록이 없으면 ResultCard가 렌더링되지 않는다', () => {
    const emptyResult: OCRResult = { ...mockResult, blocks: [], plainText: '' }
    render(<ResultScreen {...makeProps(emptyResult)} />)
    expect(screen.queryAllByTestId('result-card')).toHaveLength(0)
  })
})
