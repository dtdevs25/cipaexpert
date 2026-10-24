import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import { apiRouter } from './src/backend/api';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Configuração segura de CORS e parse de JSON
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Healthcheck do CapRover e Docker
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'CIPA Expert Enterprise API & Platform',
    standard: 'NR-5 / NR-4 / Lei 14.457/2022'
  });
});

// Rotas da API REST protegidas
app.use('/api', apiRouter);

// Servir frontend compilado em produção (Vite dist)
const distPath = path.basename(__dirname) === 'dist' ? __dirname : path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback SPA - redireciona todas as demais rotas para o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Inicialização do servidor
app.listen(PORT, HOST, () => {
  console.log(`🚀 [BACKEND] CIPA Expert em execução na porta ${PORT} (${HOST})`);
  console.log(`🛡️  [BACKEND] Autenticação e APIs ativas em /api`);
});
