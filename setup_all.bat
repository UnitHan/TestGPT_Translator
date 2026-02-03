@echo off
chcp 65001 >nul
echo ====================================
echo 테스트 케이스 번역 도구 - 전체 설정
echo ====================================
echo.

echo [1/5] venv 가상환경 설정 중...
call setup_venv.bat

echo.
echo [2/5] 샘플 엑셀 파일 생성 중...
call venv\Scripts\activate.bat
py create_sample.py

echo.
echo [3/5] Node.js 패키지 설치 중...
call npm install

echo.
echo [4/5] Electron 앱 테스트...
echo 앱을 실행하려면 다음 명령을 사용하세요:
echo   npm start
echo.

echo [5/5] 인스톨러 빌드...
echo 인스톨러를 만들려면 다음 명령을 사용하세요:
echo   npm run dist
echo.

echo ====================================
echo ✓ 모든 설정이 완료되었습니다!
echo ====================================
pause
