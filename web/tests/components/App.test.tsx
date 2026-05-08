import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { App } from '../../src/App'

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>
  )
}

describe('App', () => {
  it('내비게이션이 렌더링된다', () => {
    renderApp()
    expect(screen.getByText('SmartOCR')).toBeInTheDocument()
    expect(screen.getByText('이미지 업로드')).toBeInTheDocument()
    expect(screen.getByText('카메라')).toBeInTheDocument()
  })

  it('기본 경로에서 UploadPage가 렌더링된다', () => {
    renderApp('/')
    expect(screen.getByText('이미지 OCR')).toBeInTheDocument()
  })

  it('카메라 링크 클릭 시 CameraPage로 이동한다', async () => {
    renderApp('/')
    await userEvent.click(screen.getByText('카메라'))
    expect(screen.getByText('실시간 카메라 OCR')).toBeInTheDocument()
  })
})
