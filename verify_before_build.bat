@echo off
setlocal EnableDelayedExpansion
echo ============================================
echo Pre-build verification (full check)
echo ============================================
echo.

set ERROR_COUNT=0
set WARNING_COUNT=0

echo [1/6] Required files
for %%F in (
  "app.py"
  "templates\index.html"
  "templates\icon.png"
  "electron\main.js"
  "electron\preload.js"
  "icon.ico"
  "icon.iconset\icon_256x256.png"
  "package.json"
  "translation-server.spec"
) do (
  if not exist %%F (
    echo [MISSING] %%F
    set /a ERROR_COUNT+=1
  ) else (
    echo [OK] %%F
  )
)

echo.
echo [2/6] Virtual environment
if not exist "venv\Scripts\python.exe" (
  echo [MISSING] venv\Scripts\python.exe
  echo   Run setup_venv.bat first.
  set /a ERROR_COUNT+=1
) else (
  echo [OK] venv\Scripts\python.exe
)

echo.
echo [3/6] Python packages
call venv\Scripts\activate.bat
for %%P in (
  flask
  flask-cors
  openpyxl
  google-generativeai
  cryptography
  pyinstaller
  pyparsing
  setuptools
) do (
  pip show %%P >nul 2>&1
  if !errorlevel! neq 0 (
    echo [MISSING] %%P
    set /a ERROR_COUNT+=1
  ) else (
    echo [OK] %%P
  )
)

echo.
echo [4/6] Node.js packages
if not exist "node_modules\" (
  echo [MISSING] node_modules
  echo   Run npm install first.
  set /a ERROR_COUNT+=1
) else (
  echo [OK] node_modules
)
for %%N in (
  "node_modules\electron"
  "node_modules\electron-builder"
  "node_modules\electron-store"
) do (
  if not exist %%N (
    echo [MISSING] %%N
    set /a ERROR_COUNT+=1
  ) else (
    echo [OK] %%N
  )
)

echo.
echo [5/6] Spec sanity checks
findstr /C:"('templates', 'templates')" translation-server.spec >nul
if !errorlevel! neq 0 (
  echo [MISSING] templates in datas
  set /a ERROR_COUNT+=1
) else (
  echo [OK] templates in datas
)

findstr /C:"('icon.iconset', 'icon.iconset')" translation-server.spec >nul
if !errorlevel! neq 0 (
  echo [MISSING] icon.iconset in datas
  set /a ERROR_COUNT+=1
) else (
  echo [OK] icon.iconset in datas
)

findstr /C:"pyparsing" translation-server.spec >nul
if !errorlevel! neq 0 (
  echo [MISSING] pyparsing in hiddenimports
  set /a ERROR_COUNT+=1
) else (
  echo [OK] pyparsing in hiddenimports
)

findstr /C:"console=False" translation-server.spec >nul
if !errorlevel! neq 0 (
  echo [WARNING] console=False not found
  set WARN_CONSOLE=1
) else (
  echo [OK] console=False
)

echo.
echo [6/6] Port check (optional)
netstat -ano | findstr :5000 >nul
if !errorlevel! equ 0 (
  echo [WARNING] Port 5000 is in use (dev run may fail)
  set WARN_PORT=1
) else (
  echo [OK] Port 5000 available
)

echo.
echo ============================================
if !ERROR_COUNT! equ 0 (
  echo [PASS] All required items present.
) else (
  echo [FAIL] !ERROR_COUNT! required items missing.
)
set WARNING_COUNT=0
if defined WARN_CONSOLE set /a WARNING_COUNT+=1
if defined WARN_PORT set /a WARNING_COUNT+=1
if !WARNING_COUNT! gtr 0 echo [WARN] !WARNING_COUNT! warnings.
echo ============================================
echo.
pause
