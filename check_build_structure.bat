@echo off
chcp 65001 >nul
echo ============================================
echo 빌드 구조 점검 (개발 모드 코드 검출)
echo ============================================
echo.

set WARNING_COUNT=0

echo [1/5] app.py 검사...
findstr /C:"debug=True" app.py >nul
if %errorlevel% equ 0 (
    echo ✗ app.py에 debug=True 발견!
    set /a WARNING_COUNT+=1
) else (
    echo ✓ app.py debug=False 확인
)

findstr /C:"level=logging.DEBUG" app.py >nul
if %errorlevel% equ 0 (
    echo ✗ app.py에 logging.DEBUG 발견!
    set /a WARNING_COUNT+=1
) else (
    echo ✓ app.py logging.INFO 확인
)

echo.
echo [2/5] electron/main.js 검사...
findstr /C:"console.log" electron\main.js >nul
if %errorlevel% equ 0 (
    echo ⚠ console.log 존재 (정상 - 디버깅용)
)

findstr /C:"app.isPackaged" electron\main.js >nul
if %errorlevel% equ 0 (
    echo ✓ 개발/프로덕션 모드 분기 확인
) else (
    echo ✗ app.isPackaged 체크 없음!
    set /a WARNING_COUNT+=1
)

echo.
echo [3/5] package.json 검사...
findstr /C:"\"!templates/\*\*/\*\"" package.json >nul
if %errorlevel% equ 0 (
    echo ✓ templates 폴더 제외 확인
) else (
    echo ✗ templates 폴더가 빌드에 포함될 수 있음!
    set /a WARNING_COUNT+=1
)

findstr /C:"\"!venv/\*\*/\*\"" package.json >nul
if %errorlevel% equ 0 (
    echo ✓ venv 폴더 제외 확인
) else (
    echo ✗ venv 폴더가 빌드에 포함될 수 있음!
    set /a WARNING_COUNT+=1
)

findstr /C:"\"!app.py\"" package.json >nul
if %errorlevel% equ 0 (
    echo ✓ app.py 파일 제외 확인
) else (
    echo ✗ app.py가 빌드에 포함될 수 있음!
    set /a WARNING_COUNT+=1
)

echo.
echo [4/5] translation-server.spec 검사...
findstr /C:"console=False" translation-server.spec >nul
if %errorlevel% equ 0 (
    echo ✓ console=False 확인 (GUI 모드)
) else (
    echo ✗ console=True 발견! 콘솔 창이 표시됩니다.
    set /a WARNING_COUNT+=1
)

findstr /C:"debug=False" translation-server.spec >nul
if %errorlevel% equ 0 (
    echo ✓ debug=False 확인
) else (
    echo ⚠ debug 설정 확인 필요
)

echo.
echo [5/5] 불필요한 개발 파일 검사...
if exist "dist\translation-server\venv\" (
    echo ✗ 빌드 결과에 venv 폴더 포함됨!
    set /a WARNING_COUNT+=1
) else (
    echo ✓ venv 폴더 제외됨
)

if exist "dist\translation-server\app.py" (
    echo ⚠ 빌드 결과에 app.py 원본 포함됨 (정상일 수 있음)
)

echo.
echo ============================================
if %WARNING_COUNT% equ 0 (
    echo ✓ 모든 구조 검사 통과!
    echo.
    echo 빌드 가능 상태입니다.
) else (
    echo ✗ %WARNING_COUNT%개의 경고 발견
    echo.
    echo 빌드 전에 수정이 필요합니다.
)
echo ============================================
echo.

echo [추가 권장 사항]
echo.
echo 1. 빌드 전 클린:
echo    rmdir /s /q dist
echo    rmdir /s /q build
echo.
echo 2. Python 빌드 크기 확인:
echo    dir "dist\translation-server\translation-server.exe"
echo    정상 크기: 15-25MB
echo.
echo 3. Electron 빌드 크기 확인:
echo    dir "dist\TestGPT TC Translator Setup.exe"
echo    정상 크기: 80-120MB
echo.

pause
