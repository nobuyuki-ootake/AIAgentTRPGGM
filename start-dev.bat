@echo off
echo Starting TRPG AI Agent GM Development Environment...

:: Check if pnpm is available
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo pnpm not found. Please install pnpm first:
    echo npm install -g pnpm
    pause
    exit /b 1
)

:: Install root dependencies
echo Installing root dependencies...
call pnpm install --no-optional

:: Install app dependencies
echo Installing app dependencies...
cd apps\frontend
call pnpm install --no-optional
cd ..\..

cd apps\proxy-server
call pnpm install --no-optional
cd ..\..

cd packages\types
call pnpm install --no-optional
call pnpm run build
cd ..\..

:: Start development servers
echo.
echo Starting development servers...
echo Frontend will be available at http://localhost:5173
echo Proxy server will be available at http://localhost:3001
echo.
echo Press Ctrl+C to stop all servers
echo.

:: Use concurrently to run both servers
where npx >nul 2>nul
if %errorlevel% equ 0 (
    npx concurrently --names "TYPES,FRONTEND,PROXY" --prefix-colors "blue,green,yellow" "cd packages/types && pnpm run dev" "cd apps/frontend && pnpm run dev" "cd apps/proxy-server && pnpm run dev"
) else (
    echo npx not available. Please run the following commands in separate terminals:
    echo 1. cd packages\types ^&^& pnpm run dev
    echo 2. cd apps\frontend ^&^& pnpm run dev
    echo 3. cd apps\proxy-server ^&^& pnpm run dev
    pause
)