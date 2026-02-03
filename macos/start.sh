#!/bin/bash
# macOS용 개발 서버 시작 스크립트

echo "=========================================="
echo "TestGPT TC Translator 시작"
echo "=========================================="

# 가상환경 활성화
source venv/bin/activate

# Electron 실행
cd ..
npm start
