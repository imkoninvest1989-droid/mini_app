import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Telegram Web App API
window.Telegram?.WebApp?.ready();
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.expand();
  window.Telegram.WebApp.setHeaderColor('#007A6B');
  window.Telegram.WebApp.setBackgroundColor('#FFFFFF');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)