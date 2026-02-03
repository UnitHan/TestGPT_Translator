@echo off
chcp 65001 >nul
echo ========================================
echo Spec 파일 진단
echo ========================================
echo.

echo [Spec 파일 내용 확인]
type translation-server.spec
echo.

echo [테스트: spec 파일에 COLLECT 있는지 검색]
findstr /C:"COLLECT" translation-server.spec && (
    echo ✓ COLLECT 발견됨
) || (
    echo ✗ COLLECT 없음!
)

echo.
echo [테스트: exclude_binaries=True 있는지 검색]
findstr /C:"exclude_binaries=True" translation-server.spec && (
    echo ✓ exclude_binaries=True 발견됨
) || (
    echo ✗ exclude_binaries=True 없음!
)

echo.
pause
