import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  base: 'http://localhost:5002/',
  plugins: [
    react(),
    federation({
      name: 'sales',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.jsx'
      },
      shared: ['react', 'react-dom']
    })
  ],
  server: {
    port: 5002
  },
  preview: {
    port: 5002
  },
  build: {
    target: 'esnext',
    modulePreload: true,
    minify: false,
    cssCodeSplit: false
  }
})
