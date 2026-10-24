# Frontend Completion and Local Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finalizar a arquitetura e componentes do frontend do CIPA Expert com camada de persistência local/mock, permitindo testes completos e interativos de todos os fluxos de usuário no navegador antes do desenvolvimento do backend.

**Architecture:** Frontend SPA em React 19 + TypeScript + Vite + Tailwind CSS v4. Implementação de uma camada de repositório mock reativa (`localStorage`) desacoplada para simular o banco de dados e APIs do backend, com testes visuais e interativos locais automatizados via navegador.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Motion, LocalStorage Mock API, Vitest / Playwright / Browser Subagent.

---

### Task 1: Setup e Validação do Ambiente Local de Desenvolvimento

**Files:**
- Create: `tests/setup.test.ts` (ou script de validação)
- Modify: `package.json:6-14`

**Step 1: Instalar dependências do projeto**
Executar comando no terminal para instalar os pacotes necessários:
Run: `npm install`
Expected: Instalação bem-sucedida de `react`, `react-dom`, `vite`, `tailwindcss`, `lucide-react`, etc.

**Step 2: Verificar compilação TypeScript**
Run: `npx tsc --noEmit`
Expected: Saída sem erros de tipagem nos arquivos existentes.

**Step 3: Testar subida do servidor local Vite**
Run: `npm run dev`
Expected: Servidor rodando em `http://localhost:3000` respondendo com código 200 e renderizando a Landing Page.

**Step 4: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: setup and validate local dev environment"
```

---

### Task 2: Camada de Mock State & Persistência Local (LocalStorage Store)

**Files:**
- Create: `src/services/mockStorage.ts`
- Create: `src/context/CipaContext.tsx`
- Modify: `src/App.tsx:1-40`

**Step 1: Criar o serviço de armazenamento mock com sincronização em `localStorage`**
Criar `src/services/mockStorage.ts` contendo:
- Métodos CRUD tipados para `companies`, `users`, `dimensionamentos`, `eleicoes`, `votos`, `atas`, `acoes5w2h`, `assinaturas`.
- Carga de dados iniciais (`DEMO_USERS`, `INITIAL_COMPANIES`) caso o storage esteja vazio.
- Utilitário de reset para estado padrão de fábrica.

**Step 2: Criar o Contexto React (`CipaContext.tsx`)**
Prover estado global reativo para que qualquer alteração em telas (novo usuário, nova empresa, novo voto, ata assinada) seja refletida instantaneamente sem precisar de backend.

**Step 3: Conectar o `CipaContext` ao `App.tsx`**
Envolver os componentes no provider e substituir estados soltos por hooks do contexto (`useCipa()`).

**Step 4: Teste manual / verificação local**
Abrir o navegador em `http://localhost:3000`, cadastrar um item em "Cadastros", recarregar a página e constatar que o item permanece salvo.

**Step 5: Commit**
```bash
git add src/services/mockStorage.ts src/context/CipaContext.tsx src/App.tsx
git commit -m "feat: add unified localStorage reactive mock store"
```

---

### Task 3: Conclusão do Módulo 1 (Dimensionamento NR-5) & Histórico

**Files:**
- Modify: `src/components/modules/Module1Dimensionamento.tsx`
- Create: `src/components/modules/dimensionamento/DimensionamentoHistoryModal.tsx`

**Step 1: Integrar formulário de cálculo com o armazenamento local**
Permitir que após calcular o dimensionamento pelo CNAE e quantidade de empregados, o usuário clique em "Salvar Dimensionamento na Unidade".

**Step 2: Criar histórico de dimensionamentos anteriores**
Exibir histórico com data, autor, CNAE selecionado, grupo do Quadro I, efetivos/suplentes e botão para reabrir ou imprimir o parecer técnico.

**Step 3: Melhorar exportação e impressão**
Otimizar a visualização em PDF / Print do Quadro de Dimensionamento oficial formatado conforme NR-5.

**Step 4: Teste local**
Simular dimensionamento para CNAE Grau de Risco 4 com 150 empregados, salvar, e conferir no histórico e na exportação impressa.

**Step 5: Commit**
```bash
git add src/components/modules/Module1Dimensionamento.tsx src/components/modules/dimensionamento/
git commit -m "feat(module1): complete sizing persistence and history"
```

---

### Task 4: Conclusão do Módulo 2 (Eleição Online) & Experiência do Eleitor

**Files:**
- Modify: `src/components/modules/Module2EleicaoOnline.tsx`
- Create: `src/components/modules/eleicao/VotingBoothModal.tsx`
- Create: `src/components/modules/eleicao/ElectionReceiptModal.tsx`

**Step 1: Implementar cabine de votação interativa (`VotingBoothModal.tsx`)**
- Exibição dos candidatos com foto, nome, setor e proposta.
- Voto em branco e voto nulo com confirmação em 2 etapas.
- Geração de comprovante de votação com hash criptográfico SHA-256 e timestamp.

**Step 2: Implementar bloqueio antifraude local**
Ao logar com perfil `eleitor` (ex: `eleitor@empresa.com`), verificar se o usuário já votou nesta eleição. Se sim, exibir tela com o comprovante e status "Voto já computado".

**Step 3: Gráficos de apuração e encerramento do pleito**
Ao logar como `admin` ou `sesmt`, permitir o encerramento do período eleitoral e visualização imediata da contagem de votos, lista de eleitos titulares e suplentes, e geração da Ata de Eleição e Apuração.

**Step 4: Teste local**
Logar como eleitor, votar, verificar bloqueio de voto duplicado, logar como admin e conferir o resultado da apuração atualizado em tempo real.

**Step 5: Commit**
```bash
git add src/components/modules/Module2EleicaoOnline.tsx src/components/modules/eleicao/
git commit -m "feat(module2): add voting booth, receipt and real-time tallying"
```

---

### Task 5: Conclusão do Módulo 3 (Gestão CIPA & Mapa de Riscos Interativo)

**Files:**
- Modify: `src/components/modules/Module3GestaoCIPA.tsx`
- Create: `src/components/modules/gestao/InteractiveRiskMap.tsx`
- Create: `src/components/modules/gestao/ActionPlanModal.tsx`

**Step 1: Criar o Mapa de Riscos Interativo (`InteractiveRiskMap.tsx`)**
- Grid visual dos setores da empresa (Produção, Almoxarifado, Escritório, etc.).
- Adicionar pontos de risco com círculo padronizado NR-5 (Pequeno, Médio, Grande) e cor oficial (Verde = Físico, Vermelho = Químico, Marrom = Biológico, Amarelo = Ergonômico, Azul = Acidentes).
- Salvar e exportar mapa de risco em alta resolução.

**Step 2: Conectar o Plano de Ação 5W2H**
- Adição dinâmica de planos de ação preventivos (O que, Por que, Onde, Quem, Quando, Como, Quanto custa).
- Status em Kanban ou lista (Pendente, Em Andamento, Concluído).

**Step 3: Integração das Reuniões com o Portal de Assinaturas**
Ao salvar uma nova ata de reunião ordinária, enviá-la automaticamente para o status de "Pendente de Assinatura" no portal de assinaturas digitais.

**Step 4: Teste local**
Criar um risco ergonômico no setor de escritório, adicionar uma ação 5W2H e validar a ata de reunião no portal de assinaturas.

**Step 5: Commit**
```bash
git add src/components/modules/Module3GestaoCIPA.tsx src/components/modules/gestao/
git commit -m "feat(module3): add interactive risk map and 5W2H action tracker"
```

---

### Task 6: Validação End-to-End Visual no Navegador (Browser Subagent / Local Testing)

**Files:**
- Test target: `http://localhost:3000`

**Step 1: Iniciar servidor dev**
Executar `npm run dev` e garantir funcionamento sem warnings no console.

**Step 2: Executar auditoria de fluxos principais no navegador**
- Testar troca de perfis (Master -> Admin -> Eleitor).
- Testar troca de empresa ativa no dropdown multi-empresa.
- Testar criação de ata e assinatura digital com certificado gerado.
- Testar comportamento responsivo no mobile (gaveta lateral retrátil / menu touch).

**Step 3: Documentar resultados dos testes**
Registrar capturas de tela e checklist de conformidade no relatório de validação frontend.

**Step 4: Commit**
```bash
git add docs/plans/
git commit -m "docs: finalize frontend local testing plan and execution log"
```
