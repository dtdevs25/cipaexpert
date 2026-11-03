# 🚀 CIPA EXPERT - Como Executar em Qualquer Notebook

Este guia foi elaborado para garantir que o **CIPA Expert** funcione com 100% de estabilidade em qualquer notebook (Windows, Mac ou Linux), permitindo tanto a execução normal quanto a **execução em segundo plano**, para que você continue usando o seu computador normalmente para outras tarefas.

---

## ⚡ 1. Execução no Windows (Recomendada)

### Opção A: Rodar em Segundo Plano (Silencioso e Invisível)
> **Ideal para o dia a dia**: não abre janela preta do terminal, roda com consumo levíssimo de memória (~50MB) e abre a plataforma no seu navegador. Você pode usar seu computador para Word, Excel, e-mails, vídeos ou qualquer outra tarefa sem nenhuma interrupção!

1. Localize o arquivo:
   ```text
   iniciar_segundo_plano.vbs
   ```
2. **Dê 2 cliques nele**.
3. O sistema inicia em segundo plano, abre o navegador padrão automaticamente em `http://localhost:3000` e exibe uma notificação de sucesso.

#### Como Parar o Serviço em Segundo Plano:
- Dê 2 cliques em `parar_segundo_plano.bat`. Ele encerra o processo e libera toda a memória.

#### Como Verificar se o Sistema está Rodando:
- Dê 2 cliques em `verificar_status.bat`. Ele faz um teste de saúde (*healthcheck*) e mostra o status em tempo real.

---

### Opção B: Execução Padrão (com Janela do Console)
1. Dê 2 cliques em:
   ```text
   iniciar_cipa_expert.bat
   ```
2. O script verifica se o Node.js está instalado, instala dependências e compila automaticamente se necessário, e abre o navegador em `http://localhost:3000`.

---

## 🍎 2. Execução no macOS ou Linux

1. Abra o Terminal na pasta do projeto.
2. Dê permissão e execute:
   ```bash
   chmod +x iniciar_cipa_expert.sh parar_cipa_expert.sh
   ./iniciar_cipa_expert.sh
   ```
3. O sistema roda via `nohup` em segundo plano e abre `http://localhost:3000`.
4. Para parar:
   ```bash
   ./parar_cipa_expert.sh
   ```

---

## 📝 3. Recursos de Formatação de Texto, Mídias e Links

Ao postar ou editar qualquer texto no sistema (editais, propostas de candidatos, comunicados oficiais, convocações e atas):
1. **Caracteres Especiais 100% Suportados**:
   - Pontuações e acentos da língua portuguesa (`ç`, `ã`, `é`, `ó`, etc.).
   - Símbolos jurídicos e técnicos (`§` parágrafo, `°` grau, `ª` ordinal, `•` bullet, `✓` check, `★` destaque, `⚠️` alerta, `⚖️` norma).
2. **Mídias e Fotos**:
   - Clique no botão **"Mídia / Foto"** para selecionar qualquer imagem do seu computador (até 2MB) ou insira a URL de uma foto.
3. **Links Clicáveis**:
   - Clique no botão **"Link"** para adicionar links clicáveis que direcionam o leitor para vídeos, pastas do Drive, sites ou arquivos PDF.
4. **Visualização em Tempo Real**:
   - Use a aba **"Visualizar Postagem"** antes de salvar para conferir exatamente como os colaboradores verão seu conteúdo.

---

## 🔒 4. Requisitos Mínimos
- **Sistema Operacional**: Windows 10/11, macOS 11+, ou Linux.
- **Node.js**: Versão 18.x ou superior (instalador gratuito disponível em [nodejs.org](https://nodejs.org)).
- **Memória RAM necessária**: ~50 MB (execução super leve).
