import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CameraView } from '../../src/components/CameraView'

describe('CameraView', () => {
  it('카메라 시작 버튼이 렌더링된다', () => {
    render(<CameraView />)
    expect(screen.getByTestId('start-camera')).toBeInTheDocument()
  })

  it('video 엘리먼트가 렌더링된다', () => {
    render(<CameraView />)
    expect(screen.getByTestId('camera-video')).toBeInTheDocument()
  })

  it('카메라 시작 버튼 클릭 시 getUserMedia가 호출된다', async () => {
    render(<CameraView apiKey="test-key" />)
    await userEvent.click(screen.getByTestId('start-camera'))
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
  })

  it('getUserMedia 실패 시 에러 메시지가 표시된다', async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(
      new Error('Permission denied')
    )
    render(<CameraView />)
    await userEvent.click(screen.getByTestId('start-camera'))
    expect(await screen.findByTestId('camera-error')).toBeInTheDocument()
  })
})
