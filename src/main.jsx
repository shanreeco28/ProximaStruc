import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { isNativeApp } from './native/platform'

// The iOS app draws edge to edge; the native-app class adds safe-area spacing in index.css.
if (isNativeApp()) document.documentElement.classList.add('native-app')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
