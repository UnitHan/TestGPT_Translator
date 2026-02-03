"""
간단한 테스트 앱 - onedir 빌드 확인용
"""
import sys
import os

def main():
    print("=" * 60)
    print("테스트 앱 실행")
    print("=" * 60)
    print(f"sys.executable: {sys.executable}")
    print(f"sys.argv[0]: {sys.argv[0]}")
    print(f"__file__: {__file__}")
    print(f"frozen: {getattr(sys, 'frozen', False)}")
    print(f"_MEIPASS: {getattr(sys, '_MEIPASS', 'Not frozen')}")
    
    if getattr(sys, 'frozen', False):
        base_dir = os.path.dirname(sys.executable)
        print(f"\n[FROZEN MODE]")
        print(f"Base directory: {base_dir}")
        print(f"\nFiles in base directory:")
        for item in os.listdir(base_dir):
            print(f"  - {item}")
    else:
        print(f"\n[DEV MODE]")
        base_dir = os.path.dirname(os.path.abspath(__file__))
        print(f"Base directory: {base_dir}")
    
    print("=" * 60)
    print("Press Enter to exit...")
    input()

if __name__ == "__main__":
    main()
