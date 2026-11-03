#!/usr/bin/env bash
# ==============================================================================
# CIPA Expert - Inicializador para Linux / macOS
# Suporta modo interativo e modo daemon em segundo plano (background)
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# 1. Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não foi encontrado. Instale o Node.js v18+ em https://nodejs.org"
    exit 1
fi

# 2. Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# 3. Compilar se necessário
if [ ! -f "dist/server.js" ]; then
    echo "⚙️ Compilando aplicação..."
    npm run build
fi

echo "🚀 Iniciando CIPA Expert em segundo plano..."
nohup node dist/server.js > /dev/null 2>&1 &
PID=$!
echo "✅ CIPA Expert ativo com PID: $PID"
echo "🌐 Acesse: http://localhost:3000"

# Tentar abrir no navegador padrão
if command -v xdg-open &> /dev/null; then
    sleep 2 && xdg-open "http://localhost:3000" &
elif command -v open &> /dev/null; then
    sleep 2 && open "http://localhost:3000" &
fi
