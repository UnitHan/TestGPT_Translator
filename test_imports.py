"""
빌드된 exe가 필수 모듈들을 올바르게 import할 수 있는지 테스트
빌드 전에 이 스크립트를 실행하여 문제를 미리 감지
"""
import sys
from pathlib import Path

# 테스트할 필수 모듈들
REQUIRED_IMPORTS = [
    # Flask 생태계
    'flask',
    'flask.json',
    'flask.templating',
    'flask_cors',
    'werkzeug',
    'werkzeug.security',
    'werkzeug.utils',
    'werkzeug.test',
    'jinja2',
    'jinja2.tests',
    'jinja2.filters',
    'click',
    'itsdangerous',
    'markupsafe',
    
    # Google AI
    'google.generativeai',
    'google.ai.generativelanguage_v1beta',
    'google.api_core',
    
    # Excel
    'openpyxl',
    'openpyxl.styles',
    'openpyxl.utils',
    'openpyxl.cell.cell',
    
    # 기타
    'cryptography',
    'pkg_resources',
    'pyparsing',
    'psutil',
]

def test_import(module_name):
    """모듈 import 테스트"""
    try:
        __import__(module_name)
        return True, None
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 60)
    print("필수 모듈 Import 테스트")
    print("=" * 60)
    print()
    
    failed = []
    passed = []
    
    for module in REQUIRED_IMPORTS:
        success, error = test_import(module)
        if success:
            print(f"✓ {module}")
            passed.append(module)
        else:
            print(f"✗ {module}: {error}")
            failed.append((module, error))
    
    print()
    print("=" * 60)
    print(f"결과: {len(passed)}/{len(REQUIRED_IMPORTS)} 통과")
    print("=" * 60)
    
    if failed:
        print()
        print("⚠️  실패한 모듈:")
        for module, error in failed:
            print(f"  - {module}")
            print(f"    {error}")
        print()
        print("🔧 해결 방법:")
        print("  1. translation-server.spec의 hiddenimports에 추가")
        print("  2. is_excluded_pure 함수에서 해당 패키지 보호")
        print("  3. pip install로 패키지 설치 확인")
        return 1
    else:
        print()
        print("✅ 모든 필수 모듈을 정상적으로 import할 수 있습니다!")
        print("   빌드를 진행해도 안전합니다.")
        return 0

if __name__ == "__main__":
    sys.exit(main())
