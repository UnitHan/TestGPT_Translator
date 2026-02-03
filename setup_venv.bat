@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
echo ============================================
echo 테스트 케이스 번역 도구 - venv 환경 설정
echo ============================================
echo.

REM venv가 이미 존재하는지 확인
if exist "venv\" (
    echo.
    echo [!] venv 폴더가 이미 존재합니다.
    echo.
    echo Y = 삭제하고 새로 만들기
    echo N = 기존 venv 사용하기
    echo.
    set /p "answer=선택 (Y/N): "
    if /i "!answer!"=="Y" (
        echo.
        echo [*] 기존 venv 삭제 중...
        rmdir /s /q venv
    ) else (
        echo.
        echo [*] 기존 venv를 사용합니다.
        goto activate
    )
)

echo.
echo [1/4] Python 가상환경(venv) 생성 중...
py -m venv venv

:activate
echo.
echo [2/4] 가상환경 활성화 중...
call venv\Scripts\activate.bat

echo.
echo [3/4] pip 업그레이드 중...
py -m pip install --upgrade pip

echo.
echo [4/4] 필요한 패키지 설치 중...
pip install -r requirements.txt

echo.
echo ============================================
echo ✓ 설정 완료!
echo ============================================
echo.
echo 가상환경이 활성화되었습니다.
echo 앞으로 이 프로젝트를 사용할 때는 다음 명령으로 활성화하세요:
echo.
echo   venv\Scripts\activate
echo.
echo 또는 start.bat을 실행하세요.
echo ============================================
pause
