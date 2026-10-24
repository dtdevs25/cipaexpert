import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { CipaProvider } from './context/CipaContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <CipaProvider>
    <App />
  </CipaProvider>
);
