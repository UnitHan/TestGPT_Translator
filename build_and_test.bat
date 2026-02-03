@echo off
setlocal enabledelayedexpansion
echo ============================================
echo 완전 자동 빌드 및 테스트
echo ============================================
echo.

REM 1단계: 빌드 전 Import 테스트
echo [1/4] 빌드 전 Import 테스트...
call venv\Scripts\activate.bat
python test_imports.py
if errorlevel 1 (
    echo.
    echo [ERROR] Import 테스트 실패. 빌드를 중단합니다.
    echo         위의 오류를 먼저 해결하세요.
    pause
    exit /b 1
)

echo.
echo ============================================
echo Import 테스트 통과! 빌드를 시작합니다.
echo ============================================
echo.
pause

REM 2단계: 빌드
echo [2/4] PyInstaller 빌드...
python -m PyInstaller translation-server.spec --clean --noconfirm --log-level WARN
if errorlevel 1 (
    echo.
    echo [ERROR] 빌드 실패.
    pause
    exit /b 1
)

echo.
echo [3/4] 빌드 결과 검증...
call verify_build_result.bat

echo.
echo [4/4] 빌드된 exe 실행 테스트...
echo.
echo 주의: 이 테스트는 exe를 실제로 실행합니다.
echo       포트 5000이 사용 가능한지 확인하세요.
echo.
choice /C YN /M "exe 실행 테스트를 진행하시겠습니까"
if errorlevel 2 goto skip_test

python test_built_exe.py
if errorlevel 1 (
    echo.
    echo [ERROR] exe 실행 테스트 실패.
    echo.
    echo 수동 테스트 방법:
    echo   cd dist\translation-server
    echo   translation-server.exe
    echo.
    pause
    exit /b 1
)

:skip_test

echo.
echo ============================================
echo ✅ 모든 단계 완료!
echo ============================================
echo.
echo 빌드 결과: dist\translation-server\
echo.
echo 다음 단계:
echo   1. npm run dist    (Electron 설치 파일 생성)
echo   2. 또는 수동 테스트: cd dist\translation-server && translation-server.exe
echo.
pause
