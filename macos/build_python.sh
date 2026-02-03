#!/bin/bash
# macOS용 PyInstaller 빌드 스크립트

echo "=========================================="
echo "Python 서버 빌드 중..."
echo "=========================================="

# 가상환경 활성화
source venv/bin/activate

# 이전 빌드 삭제
rm -rf build/translation-server
rm -rf dist/translation-server

# PyInstaller로 빌드
pyinstaller translation-server-macos.spec

echo ""
if [ -f "dist/translation-server" ]; then
    echo "=========================================="
    echo "✅ 빌드 완료!"
    echo "=========================================="
    echo "생성된 파일: dist/translation-server"
else
    echo "=========================================="
    echo "❌ 빌드 실패!"
    echo "=========================================="
    exit 1
fi
