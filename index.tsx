console.log("=== INDEX.TSX START ===");

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[Global] Error:', event.error);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Global] Unhandled rejection:', event.reason);
  });
}

console.log("=== INDEX.TSX IMPORTING STYLES ===");

import './style.css';

console.log("=== INDEX.TSX STYLES LOADED ===");

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("=== INDEX.TSX MOUNTING ===");

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log("=== INDEX.TSX MOUNTED ===");