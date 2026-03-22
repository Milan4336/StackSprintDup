import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import { ThemeProvider } from './context/ThemeContext';
import { TransactionProvider } from './context/TransactionContext';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <TransactionProvider>
        <App />
      </TransactionProvider>
    </ThemeProvider>
  </React.StrictMode>
);
