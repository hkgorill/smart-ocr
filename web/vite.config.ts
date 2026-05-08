import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/components/**/*.test.tsx'],
    exclude: ['tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: { lines: 80, functions: 78, branches: 75, statements: 80 },
      include: ['src/**'],
      exclude: [
        'src/main.tsx',
        'src/test-setup.ts',
        'src/types/**',   // 타입 정의만 있는 파일
      ],
    },
  },
})
