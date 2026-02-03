@echo off
chcp 65001 >nul
echo ============================================
echo 인스톨러 전체 빌드 프로세스
echo ============================================
echo.

echo [1/4] 가상환경 확인...
if not exist "venv\" (
    echo venv가 없습니다. setup_venv.bat을 먼저 실행하세요.
    pause
    exit /b 1
)

echo.
echo [2/4] Python 앱 빌드 중...
call build_python.bat

echo.
echo [3/4] Node.js 패키지 확인...
if not exist "node_modules\" (
    echo Node.js 패키지 설치 중...
    call npm install
)

echo.
echo [4/4] Electron 인스톨러 빌드 중...
call npm run build

echo.
echo ============================================
echo ✓ 모든 빌드 완료!
echo ============================================
echo.
echo 인스톨러 위치: dist\ 폴더
echo.
pause
