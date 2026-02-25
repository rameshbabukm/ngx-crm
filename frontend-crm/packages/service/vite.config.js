import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  base: 'http://localhost:5003/',
  plugins: [
    react(),
    federation({
      name: 'service',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.jsx'
      },
      shared: ['react', 'react-dom', '@apollo/client', 'graphql']
    })
  ],
  server: {
    port: 5003
  },
  preview: {
    port: 5003
  },
  build: {
    target: 'esnext',
    modulePreload: true,
    minify: false,
    cssCodeSplit: false
  }
})
