@echo off
chcp 65001 >nul
echo ====================================
echo 테스트 케이스 번역 도구 실행
echo ====================================
echo.

echo [1/2] 가상환경 활성화 중...
call venv\Scripts\activate.bat

echo.
echo [2/2] Electron 앱 시작 중...
npm start
