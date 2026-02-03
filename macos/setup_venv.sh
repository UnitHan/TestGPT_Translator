#!/bin/bash
# macOS용 가상환경 설정 스크립트

echo "=========================================="
echo "Python 가상환경 설정 중..."
echo "=========================================="

# 가상환경 생성
python3 -m venv venv

# 가상환경 활성화
source venv/bin/activate

# pip 업그레이드
pip install --upgrade pip

# 필요한 패키지 설치
pip install -r ../requirements.txt

echo ""
echo "=========================================="
echo "✅ 가상환경 설정 완료!"
echo "=========================================="
echo ""
echo "가상환경을 활성화하려면:"
echo "  source venv/bin/activate"
echo ""
