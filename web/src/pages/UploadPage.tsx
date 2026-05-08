import { useCallback, useState } from 'react'
import { ImageDropzone } from '../components/ImageDropzone'
import { ResultViewer } from '../components/ResultViewer'
import { TextEditor } from '../components/TextEditor'
import { useOCR } from '../hooks/useOCR'

export function UploadPage() {
  const { results, loading, error, analyze, reset } = useOCR()
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    reset()
    await analyze(file)
  }, [analyze, reset])

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
        이미지 OCR
      </h1>

      <ImageDropzone onFile={handleFile} />

      {loading && (
        <p data-testid="loading-indicator" style={{ marginTop: 16, color: '#6b7280' }}>
          인식 중...
        </p>
      )}

      {error && (
        <p data-testid="error-message" style={{ marginTop: 16, color: '#ef4444' }}>
          {error}
        </p>
      )}

      {!loading && results.length > 0 && (
        <>
          <ResultViewer imageUrl={imageUrl} blocks={results} />
          <TextEditor blocks={results} />
        </>
      )}
    </main>
  )
}
