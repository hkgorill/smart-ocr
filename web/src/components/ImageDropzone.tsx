import { useCallback, useRef, useState } from 'react'

interface Props {
  onFile: (file: File) => void
  accept?: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function ImageDropzone({ onFile, accept = 'image/jpeg,image/png,image/webp' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const processFile = useCallback((file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    onFile(file)
  }, [onFile])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const onPaste = useCallback((e: React.ClipboardEvent) => {
    const file = e.clipboardData.files[0]
    if (file) processFile(file)
  }, [processFile])

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  return (
    <div
      data-testid="dropzone"
      tabIndex={0}
      role="button"
      aria-label="이미지 파일을 드롭하거나 클릭해 업로드하세요"
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onPaste={onPaste}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? '#4f46e5' : '#d1d5db'}`,
        borderRadius: 12,
        padding: 32,
        textAlign: 'center',
        cursor: 'pointer',
        background: dragging ? '#eef2ff' : '#f9fafb',
        transition: 'all 0.2s',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={onInputChange}
        data-testid="file-input"
      />
      {preview ? (
        <img
          src={preview}
          alt="preview"
          data-testid="preview-image"
          style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
        />
      ) : (
        <p style={{ color: '#6b7280', margin: 0 }}>
          📂 이미지를 드래그하거나 클릭해 업로드 (JPEG / PNG / WebP)
        </p>
      )}
    </div>
  )
}
