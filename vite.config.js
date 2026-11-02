import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// One ID per deploy. The running app compares it with /version.json on the
// live site to offer "Update available, restart" (web, installed app and the
// Android app alike), so content updates never need a new APK.
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || String(Date.now())

const versionFile = () => ({
  name: 'proximastruc-version-file',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) + '\n' })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), versionFile()],
  define: {
    'import.meta.env.VITE_APP_BUILD': JSON.stringify(BUILD_ID),
  },
})
