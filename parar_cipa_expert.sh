#!/usr/bin/env bash
# ==============================================================================
# CIPA Expert - Encerrar Servidor (Linux / macOS)
# ==============================================================================

PORT=3000
PID=$(lsof -ti :$PORT)

if [ -n "$PID" ]; then
    echo "🛑 Finalizando CIPA Expert na porta $PORT (PID $PID)..."
    kill -9 $PID
    echo "✅ Serviço encerrado com sucesso."
else
    echo "ℹ️ Nenhum processo encontrado na porta $PORT."
fi
