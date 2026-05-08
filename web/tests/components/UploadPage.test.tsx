import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { UploadPage } from '../../src/pages/UploadPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <UploadPage />
    </MemoryRouter>
  )
}

describe('UploadPage', () => {
  it('페이지 제목이 렌더링된다', () => {
    renderPage()
    expect(screen.getByText('이미지 OCR')).toBeInTheDocument()
  })

  it('드롭존이 표시된다', () => {
    renderPage()
    expect(screen.getByTestId('dropzone')).toBeInTheDocument()
  })

  it('파일 업로드 후 로딩 인디케이터가 표시된다', async () => {
    renderPage()
    const input = screen.getByTestId('file-input')
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })
    await userEvent.upload(input, file)
    // 로딩 또는 결과 중 하나가 표시되어야 함
    await waitFor(() => {
      const loading = screen.queryByTestId('loading-indicator')
      const result = screen.queryByTestId('text-editor')
      expect(loading || result).toBeTruthy()
    })
  })

  it('API 성공 후 텍스트 에디터가 표시된다', async () => {
    renderPage()
    const input = screen.getByTestId('file-input')
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })
    await userEvent.upload(input, file)
    await waitFor(() =>
      expect(screen.getByTestId('text-editor')).toBeInTheDocument()
    )
  })

  it('API 성공 후 OCR 텍스트가 표시된다', async () => {
    renderPage()
    const input = screen.getByTestId('file-input')
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })
    await userEvent.upload(input, file)
    await waitFor(() =>
      expect(screen.getByDisplayValue('테스트 문자')).toBeInTheDocument()
    )
  })
})
