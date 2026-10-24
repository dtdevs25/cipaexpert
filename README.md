# easy CIPA / CIPA Expert Enterprise 🛡️

Plataforma completa e modular para gestão inteligente de CIPA em conformidade com as normas regulamentadoras **NR-5**, **NR-4** e **Lei 14.457/2022**.

## 🚀 Módulos Principais

1. **Módulo 1 - Dimensionamento Normativo (NR-5 / NR-4):**
   - Cálculo automático baseado em CNAE, Grau de Risco (Quadro I NR-4) e número de colaboradores.
   - Suporte completo a MEI, ME, EPP e regras de Designado da CIPA.
   - Histórico de dimensionamentos e exportação de relatórios.

2. **Módulo 2 - Eleição Online Auditável:**
   - Gestão completa do processo eleitoral (comissão eleitoral, edital, prazos e candidaturas).
   - Urna digital auditável com segurança criptográfica, hashes e apuração em tempo real.

3. **Módulo 3 - Gestão Contínua da CIPA:**
   - Mapa de riscos interativo com círculos proporcionais e cores regulamentares da NR-5.
   - Gestão de atas ordinárias e extraordinárias.
   - Planos de ação 5W2H e calendário de atividades.
   - Portal e assinaturas digitais com carimbo de tempo e hash SHA-256.

4. **Administração & Multi-Tenant:**
   - Gestão de empresas e filiais/unidades com RBAC (Master, Admin Empresa, Gestor Unidade, Técnico SST, Cipeiro, Eleitor).
   - Central de lembretes e notificações automáticas de prazos.

---

## 🛠️ Tecnologias

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion.
- **Backend:** Node.js, Express, Prisma ORM (@prisma/client v5).
- **Banco de Dados:** PostgreSQL.
- **Build & Bundler:** Vite 8, esbuild.
- **Deploy:** Docker multi-stage & CapRover (`captain-definition`).

---

## 💻 Desenvolvimento Local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env

# 3. Gerar Prisma Client
npx prisma generate

# 4. Executar ambiente de desenvolvimento
npm run dev
```

---

## 🚢 Deploy no CapRover

1. Crie um app no CapRover (ex: `cipaexpert`).
2. Se for usar banco próprio ou serviço de PostgreSQL no CapRover, vincule a variável `DATABASE_URL` no painel do app (*App Configs > Environmental Variables*).
3. Conecte o repositório GitHub ao CapRover via **Deployment > Method 3: Deploy from GitHub/Gitlab/Bitbucket** (utilizando a branch `main`).
4. O CapRover usará o `captain-definition` e o `Dockerfile` multi-stage já otimizado para produção.
