import { Link, Route, Routes } from 'react-router-dom'
import { CameraPage } from './pages/CameraPage'
import { UploadPage } from './pages/UploadPage'

export function App() {
  return (
    <>
      <nav
        style={{
          background: '#4f46e5',
          padding: '12px 24px',
          display: 'flex',
          gap: 24,
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>SmartOCR</span>
        <Link to="/" style={{ color: '#c7d2fe', textDecoration: 'none' }}>
          이미지 업로드
        </Link>
        <Link to="/camera" style={{ color: '#c7d2fe', textDecoration: 'none' }}>
          카메라
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/camera" element={<CameraPage />} />
      </Routes>
    </>
  )
}

export default App
