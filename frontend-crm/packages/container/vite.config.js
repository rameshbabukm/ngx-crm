import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'container',
      remotes: {
        c360: 'http://localhost:5001/assets/remoteEntry.js',
        sales: 'http://localhost:5002/assets/remoteEntry.js',
        service: 'http://localhost:5003/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom']
    })
  ],
  server: {
    port: 3000
  },
  build: {
    target: 'esnext',
    modulePreload: true,
    minify: false,
    cssCodeSplit: false
  }
})
