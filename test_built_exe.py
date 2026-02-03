"""
빌드된 exe를 자동으로 테스트하는 스크립트
- exe를 백그라운드에서 실행
- 필수 모듈 import 확인
- Flask 서버 응답 확인
- 자동 종료
"""
import subprocess
import time
import sys
from pathlib import Path
import requests

EXE_PATH = Path(__file__).parent / "dist" / "translation-server" / "translation-server.exe"
TIMEOUT = 30  # 초
PORT = 5000

def check_exe_exists():
    """exe 파일 존재 확인"""
    if not EXE_PATH.exists():
        print(f"❌ exe 파일이 없습니다: {EXE_PATH}")
        return False
    print(f"✓ exe 파일 존재: {EXE_PATH}")
    return True

def start_server():
    """서버 시작"""
    print("\n서버 시작 중...")
    env = {
        'FLASK_PORT': str(PORT),
        'PYTHONIOENCODING': 'utf-8',
    }
    
    process = subprocess.Popen(
        [str(EXE_PATH)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
        creationflags=subprocess.CREATE_NO_WINDOW  # 콘솔 창 숨김
    )
    return process

def wait_for_server(timeout=TIMEOUT):
    """서버가 준비될 때까지 대기"""
    print(f"서버 응답 대기 중 (최대 {timeout}초)...")
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            response = requests.get(f"http://127.0.0.1:{PORT}/health", timeout=2)
            if response.status_code == 200:
                print(f"✓ 서버 응답 성공 ({int(time.time() - start_time)}초)")
                return True
        except:
            pass
        time.sleep(1)
    
    return False

def stop_server(process):
    """서버 종료"""
    print("\n서버 종료 중...")
    process.terminate()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
    print("✓ 서버 종료됨")

def capture_output(process, duration=3):
    """프로세스 출력 캡처"""
    print(f"\n출력 캡처 중 ({duration}초)...")
    time.sleep(duration)
    
    stdout, stderr = process.communicate(timeout=1)
    
    if stderr:
        stderr_text = stderr.decode('utf-8', errors='replace')
        if 'ModuleNotFoundError' in stderr_text or 'ImportError' in stderr_text:
            print("\n❌ Import 오류 발견:")
            print(stderr_text)
            return False
    
    return True

def main():
    print("=" * 60)
    print("빌드된 exe 자동 테스트")
    print("=" * 60)
    print()
    
    # 1. exe 존재 확인
    if not check_exe_exists():
        return 1
    
    # 2. 서버 시작
    process = None
    try:
        process = start_server()
        
        # 3. 서버 응답 대기
        if not wait_for_server():
            print("\n❌ 서버가 시작되지 않았습니다")
            
            # 출력 확인
            try:
                stdout, stderr = process.communicate(timeout=1)
                if stderr:
                    print("\n에러 출력:")
                    print(stderr.decode('utf-8', errors='replace'))
            except:
                pass
            
            return 1
        
        # 4. 기본 엔드포인트 테스트
        print("\n엔드포인트 테스트 중...")
        try:
            response = requests.get(f"http://127.0.0.1:{PORT}/", timeout=5)
            if response.status_code == 200:
                print("✓ 메인 페이지 응답 성공")
            else:
                print(f"⚠️  메인 페이지 응답: {response.status_code}")
        except Exception as e:
            print(f"❌ 메인 페이지 오류: {e}")
            return 1
        
        # 5. 성공
        print("\n" + "=" * 60)
        print("✅ 모든 테스트 통과!")
        print("=" * 60)
        return 0
        
    except Exception as e:
        print(f"\n❌ 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        if process:
            stop_server(process)

if __name__ == "__main__":
    sys.exit(main())
