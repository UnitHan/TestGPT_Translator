@echo off
setlocal EnableDelayedExpansion
echo ============================================
echo Build result verification
echo ============================================
echo.

set ERROR_COUNT=0

echo [1/4] Python build output
if not exist "dist\translation-server\translation-server.exe" (
  echo [MISSING] dist\translation-server\translation-server.exe
  set /a ERROR_COUNT+=1
  goto ELECTRON_CHECK
)

echo [OK] translation-server.exe exists
for %%A in ("dist\translation-server\translation-server.exe") do (
  set SIZE=%%~zA
)

echo Size: !SIZE! bytes
if !SIZE! LSS 15728640 (
  echo [WARN] Size < 15MB (possible missing modules)
) else if !SIZE! GTR 31457280 (
  echo [WARN] Size > 30MB (possible extra modules)
) else (
  echo [OK] Size in expected range
)

echo.
echo [2/4] Required resources
if not exist "dist\translation-server\templates\index.html" (
  echo [MISSING] templates\index.html
  set /a ERROR_COUNT+=1
) else (
  echo [OK] templates\index.html
)

if not exist "dist\translation-server\icon.iconset\icon_256x256.png" (
  echo [MISSING] icon.iconset\icon_256x256.png
  set /a ERROR_COUNT+=1
) else (
  echo [OK] icon.iconset\icon_256x256.png
)

echo.
echo [2b/4] pyparsing bundle check
if exist "dist\translation-server\_internal\pyparsing\" (
  echo [OK] pyparsing folder
) else (
  echo [WARN] pyparsing folder missing
)

if exist "dist\translation-server\_internal\pkg_resources\_vendor\pyparsing\" (
  echo [OK] pkg_resources vendored pyparsing
) else (
  echo [WARN] pkg_resources vendored pyparsing missing
)

echo.
echo [2c/4] base_library.zip check
if exist "dist\translation-server\_internal\base_library.zip" (
  venv\Scripts\python.exe -c "import zipfile; z='dist/translation-server/_internal/base_library.zip'; f=zipfile.ZipFile(z); names=[n.lower() for n in f.namelist()]; has=lambda p: any(p in n for n in names); print('pyparsing in base_library.zip:', 'YES' if has('pyparsing') else 'NO'); print('werkzeug/test in base_library.zip:', 'YES' if has('werkzeug/test') else 'NO');"
) else (
  echo [WARN] base_library.zip missing
)

echo.
echo [3/4] Unwanted files
if exist "dist\translation-server\venv\" (
  echo [WARN] venv folder present
) else (
  echo [OK] venv folder excluded
)

if exist "dist\translation-server\*.bat" (
  echo [WARN] .bat files present
) else (
  echo [OK] .bat files excluded
)

if exist "dist\translation-server\*.sh" (
  echo [WARN] .sh files present
) else (
  echo [OK] .sh files excluded
)

:ELECTRON_CHECK
echo.
echo [4/4] Electron installer
dir "dist\TestGPT TC Translator Setup*.exe" >nul 2>&1
if !errorlevel! neq 0 (
  echo [MISSING] Installer exe not found
  set /a ERROR_COUNT+=1
  goto RESULT
)

for %%A in ("dist\TestGPT TC Translator Setup*.exe") do (
  set SETUP_SIZE=%%~zA
  set SETUP_NAME=%%~nxA
)

echo [OK] !SETUP_NAME!
echo Size: !SETUP_SIZE! bytes
if !SETUP_SIZE! LSS 52428800 (
  echo [WARN] Size < 50MB (possible missing resources)
) else if !SETUP_SIZE! GTR 157286400 (
  echo [WARN] Size > 150MB (possible extra resources)
) else (
  echo [OK] Size in expected range
)

:RESULT
echo.
echo ============================================
if !ERROR_COUNT! equ 0 (
  echo [PASS] Build outputs present.
) else (
  echo [FAIL] !ERROR_COUNT! required item(s) missing.
)
echo ============================================
echo.
pause
