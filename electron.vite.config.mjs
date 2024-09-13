import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import path from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    build: {
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'src/renderer/index.html'),
          indicator: path.resolve(__dirname, 'src/renderer/indicator.html'),
          video: path.resolve(__dirname, 'src/renderer/video.html')
        }
      }
    }
  }
})
