@echo off
setlocal
echo ============================================
echo Building Flask server (PyInstaller onedir)
echo ============================================
echo.

if not exist venv\Scripts\python.exe (
  echo [ERROR] venv\Scripts\python.exe not found. Run setup_venv.bat first.
  exit /b 1
)

echo [1/2] Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo [2/2] Running PyInstaller (spec file)...
echo.

"%~dp0venv\Scripts\python.exe" -m PyInstaller translation-server.spec --clean --noconfirm --log-level WARN

if errorlevel 1 (
  echo.
  echo [ERROR] Build failed.
  exit /b %errorlevel%
)

echo.
echo ============================================
echo Build complete.
echo ============================================
echo Output: dist\translation-server\translation-server.exe
echo.
pause
