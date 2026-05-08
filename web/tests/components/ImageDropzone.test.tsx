import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ImageDropzone } from '../../src/components/ImageDropzone'

function makeJpeg(name = 'test.jpg') {
  return new File(['fake-image'], name, { type: 'image/jpeg' })
}

describe('ImageDropzone', () => {
  it('드롭존이 렌더링된다', () => {
    render(<ImageDropzone onFile={vi.fn()} />)
    expect(screen.getByTestId('dropzone')).toBeInTheDocument()
  })

  it('파일 선택 시 onFile 콜백이 호출된다', async () => {
    const onFile = vi.fn()
    render(<ImageDropzone onFile={onFile} />)
    const input = screen.getByTestId('file-input')
    const file = makeJpeg()
    await userEvent.upload(input, file)
    expect(onFile).toHaveBeenCalledWith(file)
  })

  it('이미지 파일 선택 후 미리보기가 표시된다', async () => {
    render(<ImageDropzone onFile={vi.fn()} />)
    const input = screen.getByTestId('file-input')
    await userEvent.upload(input, makeJpeg())
    expect(screen.getByTestId('preview-image')).toBeInTheDocument()
  })

  it('허용되지 않는 파일 타입은 onFile이 호출되지 않는다', async () => {
    const onFile = vi.fn()
    render(<ImageDropzone onFile={onFile} />)
    const input = screen.getByTestId('file-input')
    const exeFile = new File(['data'], 'virus.exe', { type: 'application/octet-stream' })
    await userEvent.upload(input, exeFile)
    expect(onFile).not.toHaveBeenCalled()
  })

  it('드래그앤드롭 시 onFile이 호출된다', () => {
    const onFile = vi.fn()
    render(<ImageDropzone onFile={onFile} />)
    const dropzone = screen.getByTestId('dropzone')
    const file = makeJpeg()
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } })
    expect(onFile).toHaveBeenCalledWith(file)
  })

  it('클립보드 붙여넣기 시 onFile이 호출된다', () => {
    const onFile = vi.fn()
    render(<ImageDropzone onFile={onFile} />)
    const file = makeJpeg()
    fireEvent.paste(screen.getByTestId('dropzone'), {
      clipboardData: { files: [file] },
    })
    expect(onFile).toHaveBeenCalledWith(file)
  })
})
