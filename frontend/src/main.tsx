import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/base.css';
import './styles/ui.css';
import './styles/editor.css';
import './styles/resume.css';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('The page is missing its #root element.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
