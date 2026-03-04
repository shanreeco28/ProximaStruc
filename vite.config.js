import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["2954ac06-711e-4025-987c-1452e14848e1-00-3d1axe1f0cif2.sisko.replit.dev"]
  }
})
