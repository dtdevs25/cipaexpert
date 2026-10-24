# ─── BUILDER ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Suporte a bibliotecas nativas C no Alpine
RUN apk add --no-cache libc6-compat openssl

# Limitar o uso de memória do Node.js durante o build para evitar OOM na VPS Hetzner
ENV NODE_OPTIONS="--max-old-space-size=1536"

# Copiar manifests antes do código para aproveitar cache do Docker
COPY package*.json ./
COPY prisma ./prisma/

# Instalação limpa dos pacotes
RUN npm install --no-audit --no-fund

# Gerar o Prisma Client v5 para Alpine Linux
RUN npx prisma generate

# Copiar todo o código-fonte
COPY . .

# Build do frontend com Vite
RUN npm run build

# ─── RUNNER ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Utilitários e bibliotecas de suporte ao Prisma Engine no Alpine
RUN apk add --no-cache libc6-compat openssl dos2unix

# Usuário de sistema sem privilégios de root para segurança OWASP
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copiar dependências, prisma schema/client e arquivos compilados com permissão do appuser
COPY --chown=appuser:nodejs --from=builder /app/package*.json ./
COPY --chown=appuser:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=appuser:nodejs --from=builder /app/prisma ./prisma
COPY --chown=appuser:nodejs --from=builder /app/dist ./dist
COPY --chown=appuser:nodejs --from=builder /app/src ./src
COPY --chown=appuser:nodejs --from=builder /app/server.js ./server.js
COPY --chown=appuser:nodejs --from=builder /app/start.sh ./start.sh

# Garantir formato Unix e permissão de execução no start.sh
RUN dos2unix ./start.sh && chmod +x ./start.sh

USER appuser

EXPOSE 3000
ENV PORT=3000
ENV HOST="0.0.0.0"

CMD ["./start.sh"]
