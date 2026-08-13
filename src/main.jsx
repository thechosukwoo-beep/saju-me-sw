import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ResultPage from './ResultPage.jsx'
import { getSharePath } from './share'

const sharedReadingId = getSharePath()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {sharedReadingId ? <ResultPage readingId={sharedReadingId} /> : <App />}
  </StrictMode>,
)
