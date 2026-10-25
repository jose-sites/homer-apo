@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto missing
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)"
if errorlevel 1 goto missing
if not exist .env copy .env.example .env >nul
if not exist node_modules (
 call npm ci
 if errorlevel 1 goto failed
)
call npm run build
if errorlevel 1 goto failed
echo Abra http://localhost:3001 no navegador. Ctrl+C para parar.
call npm start
goto end
:missing
echo Instale Node.js 24 LTS para Windows e tente novamente.
goto end
:failed
echo Falha ao instalar ou compilar. Confira a mensagem acima.
:end
pause
