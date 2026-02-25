import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  base: 'http://localhost:5001/',
  plugins: [
    react(),
    federation({
      name: 'c360',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.jsx'
      },
      shared: ['react', 'react-dom']
    })
  ],
  server: {
    port: 5001
  },
  preview: {
    port: 5001
  },
  build: {
    target: 'esnext',
    modulePreload: true,
    minify: false,
    cssCodeSplit: false
  }
})
