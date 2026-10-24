#!/bin/sh
set -e

echo "=========================================================="
echo "🚀 [CIPA EXPERT] Inicializando Container no CapRover VPS"
echo "=========================================================="

# Se houver Prisma e DATABASE_URL configurada, sincroniza o schema do banco de dados
if [ -f "/app/prisma/schema.prisma" ] && [ -n "$DATABASE_URL" ]; then
  echo "📦 [DATABASE] Sincronizando schema do PostgreSQL (Prisma)..."
  /app/node_modules/.bin/prisma db push --accept-data-loss || echo "⚠️ Aviso: prisma db push retornou aviso, continuando..."
fi

# Inicia o servidor Node.js/Express
echo "🛡️  [BACKEND] Iniciando CIPA Expert na porta ${PORT:-3000}..."
exec node dist/server.js
