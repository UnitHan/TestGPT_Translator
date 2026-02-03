@echo off
echo ════════════════════════════════════════════════
echo 실행 중인 서버 프로세스 종료
echo ════════════════════════════════════════════════
echo.

REM translation-server.exe 프로세스 찾기
tasklist /FI "IMAGENAME eq translation-server.exe" 2>NUL | find /I /N "translation-server.exe">NUL

if "%ERRORLEVEL%"=="0" (
    echo 🔍 translation-server.exe 실행 중 감지
    echo.
    
    REM 프로세스 상세 정보 표시
    echo [실행 중인 프로세스]
    tasklist /FI "IMAGENAME eq translation-server.exe" /V
    echo.
    
    echo 프로세스를 종료하시겠습니까?
    choice /C YN /M "종료하려면 Y, 취소하려면 N"
    
    if errorlevel 2 (
        echo 취소되었습니다.
        goto :end
    )
    
    echo.
    echo 프로세스 종료 중...
    taskkill /F /IM translation-server.exe
    
    if errorlevel 1 (
        echo ❌ 프로세스 종료 실패
    ) else (
        echo ✅ 프로세스가 종료되었습니다
    )
) else (
    echo ✅ 실행 중인 translation-server.exe 프로세스가 없습니다.
)

:end
echo.
pause
