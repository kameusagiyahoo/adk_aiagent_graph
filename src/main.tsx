import { createRoot } from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './ui/AppErrorBoundary';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element #root was not found.');
}

createRoot(root).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
