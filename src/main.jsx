import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './assets/styles/globals.css'
import App from './App'

window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <App/>
    </BrowserRouter>
  </StrictMode>,
)
