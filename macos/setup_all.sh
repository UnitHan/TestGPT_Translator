#!/bin/bash
# macOS용 전체 설정 및 빌드 스크립트

echo "=========================================="
echo "TestGPT TC Translator - macOS Build"
echo "=========================================="
echo ""

# 1. Python 가상환경 설정
echo "1️⃣  Python 가상환경 설정..."
bash setup_venv.sh
if [ $? -ne 0 ]; then
    echo "❌ 가상환경 설정 실패!"
    exit 1
fi

# 2. Node.js 패키지 설치
echo ""
echo "2️⃣  Node.js 패키지 설치..."
cd ..
npm install
if [ $? -ne 0 ]; then
    echo "❌ npm install 실패!"
    exit 1
fi

# 3. Python 서버 빌드
echo ""
echo "3️⃣  Python 서버 빌드..."
cd macos
bash build_python.sh
if [ $? -ne 0 ]; then
    echo "❌ Python 빌드 실패!"
    exit 1
fi

# 4. Electron 앱 빌드
echo ""
echo "4️⃣  Electron 앱 빌드..."
cd ..
npm run build -- --mac
if [ $? -ne 0 ]; then
    echo "❌ Electron 빌드 실패!"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ 전체 빌드 완료!"
echo "=========================================="
echo ""
echo "설치 파일 위치: dist/"
ls -lh dist/*.dmg 2>/dev/null || echo "DMG 파일을 찾을 수 없습니다."
