@echo off
chcp 65001 > nul
title CIPA Expert - Inicializador do Sistema

echo ==============================================================================
echo                 🛡️ CIPA EXPERT - PLATAFORMA DE GESTÃO DA CIPA
echo ==============================================================================
echo.

:: 1. Verificar se o Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] O Node.js não foi encontrado neste notebook!
    echo Por favor, instale o Node.js versão LTS baixando em: https://nodejs.org
    echo Após instalar, execute este arquivo novamente.
    echo.
    pause
    exit /b 1
)

:: 2. Verificar dependências (node_modules)
if not exist "node_modules\" (
    echo [INFO] Primeira execução detectada! Instalando dependências necessárias...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar dependências. Verifique sua conexão.
        pause
        exit /b 1
    )
)

:: 3. Verificar build de produção (dist/server.js e dist/index.html)
if not exist "dist\server.js" (
    echo [INFO] Compilando arquivos do sistema para alta performance...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao compilar o sistema.
        pause
        exit /b 1
    )
)

echo.
echo [SUCESSO] Sistema pronto para inicialização!
echo [URL] Abrindo http://localhost:3000 no seu navegador...
echo.
echo DICA: Se preferir que o sistema rode silenciosamente em SEGUNDO PLANO sem
echo manter esta janela aberta, utilize o arquivo: "iniciar_segundo_plano.vbs"
echo.
echo ==============================================================================

:: Abrir navegador automaticamente após 2 segundos
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

:: Iniciar o servidor
node dist/server.js

pause
