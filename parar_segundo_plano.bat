@echo off
chcp 65001 > nul
title CIPA Expert - Encerrar Servidor em Segundo Plano

echo ==============================================================================
echo           🛑 CIPA EXPERT - PARAR SERVIÇO EM SEGUNDO PLANO
echo ==============================================================================
echo.
echo Localizando e finalizando processos do CIPA Expert na porta 3000...

:: Procura pelo PID ouvindo na porta 3000 e finaliza
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo [INFO] Finalizando processo com PID: %%a
    taskkill /f /pid %%a >nul 2>nul
)

echo.
echo [SUCESSO] O serviço do CIPA Expert foi encerrado com sucesso!
echo A memória e os recursos do seu notebook foram liberados.
echo ==============================================================================
echo.
pause
