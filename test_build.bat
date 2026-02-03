@echo off
chcp 65001 >nul
echo ========================================
echo 테스트 빌드 - onedir 검증
echo ========================================
echo.

echo [1/3] 가상환경 활성화...
call venv\Scripts\activate.bat

echo.
echo [2/3] 기존 빌드 결과 삭제...
if exist build\test_onedir rmdir /s /q build\test_onedir
if exist dist\test_onedir rmdir /s /q dist\test_onedir
if exist dist\test_onedir.exe del /f dist\test_onedir.exe

echo.
echo [3/3] PyInstaller 빌드...
python -m PyInstaller test_onedir.spec --clean

echo.
echo ========================================
echo 빌드 결과 확인
echo ========================================

echo.
echo [dist 폴더 내용]
dir dist

echo.
echo [dist\test_onedir 폴더 존재 여부]
if exist dist\test_onedir (
    echo ✓ dist\test_onedir 폴더 있음 - onedir 빌드 성공!
    echo.
    echo [dist\test_onedir 폴더 내용]
    dir dist\test_onedir
) else (
    echo ✗ dist\test_onedir 폴더 없음 - onedir 빌드 실패!
)

echo.
echo [dist\test_onedir.exe 파일 존재 여부]
if exist dist\test_onedir.exe (
    echo ✗ dist\test_onedir.exe 단일 파일 있음 - onefile로 빌드됨!
) else (
    echo ✓ dist\test_onedir.exe 단일 파일 없음 - 정상
)

echo.
echo ========================================
echo 테스트 실행
echo ========================================
if exist dist\test_onedir\test_onedir.exe (
    echo 빌드된 앱 실행...
    echo.
    dist\test_onedir\test_onedir.exe
) else (
    echo 실행 파일을 찾을 수 없습니다.
)

pause
