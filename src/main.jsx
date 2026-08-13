import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/app.css'
import App from './App.jsx'
import ResultPage from './pages/ResultPage.jsx'
import { getSharePath } from './lib/share'

const sharedReadingId = getSharePath()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {sharedReadingId ? <ResultPage readingId={sharedReadingId} /> : <App />}
  </StrictMode>,
)
