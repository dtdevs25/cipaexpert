@echo off
echo ============================================================
echo   GERANDO ARQUIVO DE DEPLOY PARA O CAPROVER (deploy.tar)
echo ============================================================
tar --exclude=node_modules --exclude=.git --exclude=dist --exclude=deploy.tar -cvf deploy.tar .
echo.
echo ============================================================
echo   deploy.tar gerado com sucesso! (menos de 1MB)
echo   Suba este arquivo no painel do CapRover em:
echo   Deployment -> Method 1: Upload a tar file
echo ============================================================
pause
