import '@testing-library/jest-dom'
import React from 'react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '../tests/mocks/server'

// React를 전역으로 등록 (JSX 변환이 자동 import를 지원하지 않는 환경 대비)
;(globalThis as unknown as Record<string, unknown>).React = React

// MSW 서버 라이프사이클
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// 브라우저 API Mock
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'blob:mock-url'),
})
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
})

// ResizeObserver Mock (컴포넌트 레이아웃 계산에 필요)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// 웹캠 Mock
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
})

// Clipboard Mock
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
})

// HTMLMediaElement Mock (jsdom 미구현 API)
HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
HTMLMediaElement.prototype.pause = vi.fn()
HTMLMediaElement.prototype.load = vi.fn()

// Canvas Mock (ResultViewer bounding box 렌더링)
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  clearRect: vi.fn(),
  strokeRect: vi.fn(),
  fillText: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  setLineDash: vi.fn(),
  font: '',
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 0,
})
