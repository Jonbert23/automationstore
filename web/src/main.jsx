import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/css/style.css'
import App from './App.jsx'

console.log('SHUZEE App Starting...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
} else {
  console.log('Root element found, rendering app...');
  createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
  );
  console.log('App rendered!');
}
