@echo off
chcp 65001 > nul
title CIPA Expert - Status do Serviço

echo ==============================================================================
echo             🔍 CIPA EXPERT - VERIFICAÇÃO DE STATUS DO SISTEMA
echo ==============================================================================
echo.

powershell -Command "try { $res = Invoke-RestMethod -Uri 'http://localhost:3000/health' -TimeoutSec 3; Write-Host '● STATUS: ONLINE (Serviço em execução)' -ForegroundColor Green; Write-Host ('● SERVIÇO: ' + $res.service); Write-Host ('● NORMATIVA: ' + $res.standard); Write-Host ('● UPTIME: ' + [Math]::Round($res.uptime, 1) + ' segundos'); Write-Host '● URL: http://localhost:3000' -ForegroundColor Cyan } catch { Write-Host '○ STATUS: OFFLINE (O servidor não está em execução)' -ForegroundColor Red; Write-Host 'Para iniciar, dê 2 cliques em iniciar_segundo_plano.vbs ou iniciar_cipa_expert.bat' -ForegroundColor Yellow }"

echo.
echo ==============================================================================
pause
