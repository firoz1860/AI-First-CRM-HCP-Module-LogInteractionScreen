@echo off
echo Starting AI-First CRM HCP Module...

:: Start Backend
echo [1/2] Starting Backend (FastAPI) on port 8000...
start "Backend - FastAPI" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Wait a moment
timeout /t 3 /nobreak > nul

:: Start Frontend
echo [2/2] Starting Frontend (Vite) on port 5173...
start "Frontend - Vite" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers starting...
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to open the app in browser...
pause > nul
start http://localhost:5173
