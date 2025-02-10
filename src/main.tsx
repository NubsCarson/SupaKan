import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './components/theme-provider';
import './index.css';

// This is a workaround for React Beautiful DnD in React 18 Strict Mode
const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <ThemeProvider defaultTheme="system" storageKey="kanban-theme">
      <App />
    </ThemeProvider>
  );
}
