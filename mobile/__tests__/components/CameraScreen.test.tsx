import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { CameraScreen } from '../../src/screens/CameraScreen'
import * as ocrService from '../../src/services/ocrService'
import { useCameraPermission, useCameraDevice } from 'react-native-vision-camera'

jest.mock('../../src/services/ocrService')
const mockRecognize = ocrService.recognizeImage as jest.MockedFunction<typeof ocrService.recognizeImage>
const mockUsePermission = useCameraPermission as jest.MockedFunction<typeof useCameraPermission>
const mockUseDevice = useCameraDevice as jest.MockedFunction<typeof useCameraDevice>

const mockNavigation = { navigate: jest.fn() } as any

beforeEach(() => {
  mockRecognize.mockReset()
  mockNavigation.navigate.mockReset()
  // default: granted + device found
  mockUsePermission.mockReturnValue({ hasPermission: true, requestPermission: jest.fn().mockResolvedValue(true) })
  mockUseDevice.mockReturnValue({ id: 'back-cam', position: 'back' } as any)
})

describe('CameraScreen', () => {
  it('권한이 없으면 권한 요청 뷰를 표시한다', () => {
    mockUsePermission.mockReturnValue({ hasPermission: false, requestPermission: jest.fn().mockResolvedValue(true) })
    render(<CameraScreen navigation={mockNavigation} />)
    expect(screen.getByTestId('permission-view')).toBeTruthy()
  })

  it('권한 요청 버튼을 누르면 requestPermission이 호출된다', async () => {
    const requestPermission = jest.fn().mockResolvedValue(true)
    mockUsePermission.mockReturnValue({ hasPermission: false, requestPermission })
    render(<CameraScreen navigation={mockNavigation} />)
    fireEvent.press(screen.getByTestId('request-permission-button'))
    expect(requestPermission).toHaveBeenCalled()
  })

  it('카메라 장치가 없으면 오류 뷰를 표시한다', () => {
    mockUseDevice.mockReturnValue(undefined as any)
    render(<CameraScreen navigation={mockNavigation} />)
    expect(screen.getByTestId('no-device-view')).toBeTruthy()
  })

  it('권한과 장치가 있으면 카메라 화면을 표시한다', () => {
    render(<CameraScreen navigation={mockNavigation} />)
    expect(screen.getByTestId('camera-screen')).toBeTruthy()
    expect(screen.getByTestId('capture-button')).toBeTruthy()
  })

  it('촬영 버튼을 누르면 OCR이 실행된다', async () => {
    mockRecognize.mockResolvedValue({
      blocks: [],
      plainText: '',
      processedAt: '2024-01-01T00:00:00Z',
    })
    render(<CameraScreen navigation={mockNavigation} />)
    fireEvent.press(screen.getByTestId('capture-button'))
    await waitFor(() => {
      expect(mockRecognize).toHaveBeenCalled()
    })
  })

  it('OCR 오류 시 Alert가 표시된다', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    mockRecognize.mockRejectedValue(new Error('API 오류'))
    render(<CameraScreen navigation={mockNavigation} />)
    fireEvent.press(screen.getByTestId('capture-button'))
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('오류', 'API 오류')
    })
    alertSpy.mockRestore()
  })
})
