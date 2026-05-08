import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { GalleryScreen } from '../../src/screens/GalleryScreen'
import * as ocrService from '../../src/services/ocrService'
import { launchImageLibrary } from 'react-native-image-picker'

jest.mock('../../src/services/ocrService')
const mockRecognize = ocrService.recognizeImage as jest.MockedFunction<typeof ocrService.recognizeImage>
const mockLaunch = launchImageLibrary as jest.MockedFunction<typeof launchImageLibrary>

const mockResult = {
  blocks: [{ text: '갤러리 텍스트', confidence: 0.9, bbox: { x: 0, y: 0, width: 100, height: 30 } }],
  plainText: '갤러리 텍스트',
  processedAt: '2024-01-01T00:00:00Z',
}

const mockNavigation = { navigate: jest.fn() } as any

beforeEach(() => {
  mockRecognize.mockReset()
  mockLaunch.mockReset()
  mockNavigation.navigate.mockReset()
})

describe('GalleryScreen', () => {
  it('화면 제목이 렌더링된다', () => {
    render(<GalleryScreen navigation={mockNavigation} />)
    expect(screen.getByText('갤러리에서 이미지 선택')).toBeTruthy()
  })

  it('이미지 선택 버튼이 존재한다', () => {
    render(<GalleryScreen navigation={mockNavigation} />)
    expect(screen.getByTestId('pick-image-button')).toBeTruthy()
  })

  it('이미지 선택 취소 시 아무 일도 없다', async () => {
    mockLaunch.mockResolvedValue({ didCancel: true, assets: [] } as any)
    render(<GalleryScreen navigation={mockNavigation} />)
    fireEvent.press(screen.getByTestId('pick-image-button'))
    await waitFor(() => {
      expect(mockRecognize).not.toHaveBeenCalled()
    })
  })

  it('OCR 성공 시 Result 화면으로 이동한다', async () => {
    mockLaunch.mockResolvedValue({
      didCancel: false,
      assets: [{ uri: 'file:///test.jpg' }],
    } as any)
    mockRecognize.mockResolvedValue(mockResult)

    render(<GalleryScreen navigation={mockNavigation} />)
    fireEvent.press(screen.getByTestId('pick-image-button'))

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Result', expect.objectContaining({ result: mockResult }))
    })
  })
})
