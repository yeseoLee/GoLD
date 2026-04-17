import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-utils/setup.ts',
  },
})
