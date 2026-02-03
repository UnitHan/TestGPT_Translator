@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo ════════════════════════════════════════════════
echo TestGPT TC Translator - 전체 빌드
echo ════════════════════════════════════════════════
echo.

REM 0단계: 실행 중인 프로세스 종료
echo [0/4] 실행 중인 프로세스 확인 및 종료...
tasklist /FI "IMAGENAME eq translation-server.exe" 2>NUL | find /I /N "translation-server.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ⚠️  translation-server.exe 실행 중 감지
    echo    프로세스를 종료합니다...
    taskkill /F /IM translation-server.exe >NUL 2>&1
    timeout /t 2 /nobreak >NUL
    echo ✅ 프로세스 종료 완료
) else (
    echo ✅ 실행 중인 프로세스 없음
)
echo.

REM 1단계: 가상환경 확인
if not exist venv\Scripts\python.exe (
    echo ❌ 가상환경이 없습니다. setup_venv.bat을 먼저 실행하세요.
    pause
    exit /b 1
)

REM 2단계: Import 테스트
echo [1/4] 빌드 전 검증...
call venv\Scripts\activate.bat
python test_imports.py
if errorlevel 1 (
    echo.
    echo ❌ Import 테스트 실패
    pause
    exit /b 1
)

echo.
echo ✅ 검증 완료
echo.

REM 3단계: 기존 빌드 정리 (선택적)
echo [2/4] 기존 빌드 정리...
if exist "dist\translation-server" (
    echo 기존 빌드 폴더를 삭제합니다...
    rmdir /s /q "dist\translation-server" 2>NUL
    if exist "dist\translation-server" (
        echo ⚠️  일부 파일 삭제 실패 (무시하고 진행)
    ) else (
        echo ✅ 기존 빌드 삭제 완료
    )
) else (
    echo ✅ 삭제할 기존 빌드 없음
)
echo.

REM 5단계: 빌드 검증
echo [4/4] Flask 서버 빌드 중...
echo.
python -m PyInstaller translation-server.spec --clean --noconfirm --log-level WARN
if errorlevel 1 (
    echo.
    echo ❌ 빌드 실패
    pause
    exit /b 1
)

echo.
echo ✅ 서버 빌드 완료
echo.

REM 4단계: 빌드 검증
echo [3/3] 빌드 결과 검증...
if not exist "dist\translation-server\translation-server.exe" (
    echo ❌ translation-server.exe를 찾을 수 없습니다
    pause
    exit /b 1
)

if not exist "dist\translation-server\_internal" (
    echo ❌ _internal 폴더를 찾을 수 없습니다
    pause
    exit /b 1
)

echo ✅ 빌드 검증 완료
echo.

echo ════════════════════════════════════════════════
echo ✅ 빌드 성공!
echo ════════════════════════════════════════════════
echo.
echo 출력 위치: dist\translation-server\
echo.
echo 테스트: cd dist\translation-server ^&^& translation-server.exe
echo.
