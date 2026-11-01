import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { CipaProvider } from './context/CipaContext.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary fallbackTitle="Erro ao carregar a plataforma CIPA Expert">
    <CipaProvider>
      <App />
    </CipaProvider>
  </ErrorBoundary>
);
