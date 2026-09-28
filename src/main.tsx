import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

declare global {
  interface Window {
    __dismissAppSplash?: () => void
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Hand off from the inline loading screen once the app has actually painted.
// Webfonts get a short grace period so text doesn't swap right at the crossfade.
const fontsReady = document.fonts
  ? Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1200))])
  : Promise.resolve()

fontsReady.then(() => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => window.__dismissAppSplash?.())
  })
})
