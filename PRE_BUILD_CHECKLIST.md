# 빌드 전 필수 체크리스트 ✅

**빌드하기 전에 반드시 이 체크리스트를 완료하세요!**

---

## 🔴 1단계: 개발 모드 테스트 (필수)

### 1.1 기본 실행 테스트

```bash
# 터미널에서 실행
cd c:\translation
npm start
```

**확인사항:**
- [ ] 30초 이내에 프로그램 창이 표시됨
- [ ] Flask 서버 시작 로그 확인 (`[Flask] Running on http://127.0.0.1:5000`)
- [ ] UI가 정상적으로 로드됨
- [ ] 콘솔에 에러 메시지가 없음

**실패 시:**
- `venv\Scripts\activate`로 가상환경 확인
- `python app.py`로 Flask 직접 실행 테스트
- 포트 5000 사용 확인: `netstat -ano | findstr :5000`

---

### 1.2 핵심 기능 테스트

**파일 업로드:**
- [ ] 엑셀 파일 드래그 앤 드롭 작동
- [ ] 파일 선택 버튼 작동
- [ ] 샘플 파일 생성 기능 작동

**번역 기능:**
- [ ] 번역 시작 버튼 클릭
- [ ] 진행률 표시 정상 작동
- [ ] 번역 완료 메시지 표시
- [ ] 다운로드 버튼 활성화

**설정 기능:**
- [ ] 환경설정 모달 열림
- [ ] API 키 저장 및 검증
- [ ] 설정 저장 후 재시작해도 유지

**프로그램 종료:**
- [ ] 닫기 버튼 클릭 시 정상 종료
- [ ] Flask 프로세스 자동 종료 확인 (작업 관리자)
- [ ] 오류 팝업 없음

---

## 🟡 2단계: 빌드 환경 확인

### 2.1 필수 파일 존재 확인

```bash
# 확인 스크립트
dir c:\translation\app.py
dir c:\translation\templates\index.html
dir c:\translation\electron\main.js
dir c:\translation\icon.ico
dir c:\translation\icon.iconset\icon_256x256.png
```

**체크리스트:**
- [ ] `app.py` 존재
- [ ] `templates/index.html` 존재
- [ ] `electron/main.js` 존재
- [ ] `electron/preload.js` 존재
- [ ] `icon.ico` 존재 (Windows)
- [ ] `icon.iconset/` 폴더와 PNG 파일들 존재
- [ ] `package.json` 존재
- [ ] `translation-server.spec` 존재

---

### 2.2 의존성 확인

**Python 의존성:**
```bash
venv\Scripts\activate
pip list
```

**필수 패키지 확인:**
- [ ] Flask
- [ ] flask-cors
- [ ] pandas
- [ ] openpyxl
- [ ] google-generativeai
- [ ] PyInstaller

**Node.js 의존성:**
```bash
npm list --depth=0
```

**필수 패키지 확인:**
- [ ] electron
- [ ] electron-builder
- [ ] electron-store

---

### 2.3 빌드 설정 확인

**translation-server.spec 검증:**
```python
# datas에 포함되어야 할 것들
datas = [
    ('templates', 'templates'),
    ('icon.iconset', 'icon.iconset')  # ← 추가됨
]
```

- [ ] `datas`에 `templates` 포함
- [ ] `datas`에 `icon.iconset` 포함
- [ ] `icon='icon.ico'` 설정됨
- [ ] `console=False` 설정됨 (GUI 모드)

**package.json 검증:**
```json
"build": {
  "appId": "com.testgpt.translator",
  "productName": "TestGPT TC Translator",
  "files": [
    "electron/**/*",
    "node_modules/**/*"
  ],
  "extraResources": [
    {
      "from": "dist/translation-server",
      "to": "translation-server"
    }
  ],
  "win": {
    "icon": "icon.ico"
  }
}
```

- [ ] `extraResources`에 Flask 앱 포함
- [ ] `icon.ico` 경로 정확
- [ ] `files` 배열에 필요한 파일 포함

---

## 🟢 3단계: 빌드 실행

### 3.1 클린 빌드

```bash
# 이전 빌드 결과 삭제
rmdir /s /q dist
rmdir /s /q build

# 빌드 실행
build_installer.bat
```

**빌드 중 확인사항:**
- [ ] PyInstaller 경고 없음 (WARNING 확인)
- [ ] PyInstaller 에러 없음 (ERROR 확인)
- [ ] Electron Builder 에러 없음
- [ ] 빌드 완료 메시지 표시

**예상 빌드 시간:**
- Python 앱: 2-5분
- Electron 앱: 1-2분
- **총: 3-7분**

⚠️ **10분 이상 걸리면 문제 있음!**

---

### 3.2 빌드 결과 확인

```bash
# 빌드된 파일 확인
dir dist\translation-server\translation-server.exe
dir "dist\TestGPT TC Translator Setup.exe"
```

**체크리스트:**
- [ ] `dist\translation-server\translation-server.exe` 존재
- [ ] `dist\translation-server\templates\` 폴더 존재
- [ ] `dist\translation-server\icon.iconset\` 폴더 존재
- [ ] `dist\TestGPT TC Translator Setup.exe` 존재

**파일 크기 확인:**
- translation-server.exe: ~15-25MB
- 설치 파일: ~80-120MB

⚠️ **파일 크기가 비정상적으로 크거나 작으면 문제!**

---

## 🔵 4단계: 설치 파일 테스트

### 4.1 설치 테스트

```bash
# 설치 파일 실행
"dist\TestGPT TC Translator Setup.exe"
```

**설치 중 확인사항:**
- [ ] 설치 진행률 정상 표시
- [ ] 2분 이내 설치 완료
- [ ] 설치 경로: `C:\Users\[사용자]\AppData\Local\Programs\testgpt-tc-translator\`
- [ ] 바탕화면 아이콘 생성
- [ ] 시작 메뉴 등록

⚠️ **설치가 5분 이상 걸리면 문제!**

---

### 4.2 프로그램 실행 테스트

**첫 실행:**
- [ ] 설치 후 자동 실행 또는 아이콘 더블클릭
- [ ] **60초 이내에 프로그램 창 표시**
- [ ] 로딩 화면 정상 표시
- [ ] 메인 화면 로드 완료

⚠️ **1분 이상 창이 안 뜨면 문제!**

**작업 관리자 확인:**
```
작업 관리자 (Ctrl + Shift + Esc) 열기
```

- [ ] `TestGPT TC Translator.exe` 1개만 실행 중
- [ ] `translation-server.exe` 1개만 실행 중
- [ ] 메모리 사용량: 100-300MB (정상)
- [ ] CPU 사용량: 10% 이하 (유휴 시)

⚠️ **메모리 1GB 이상 또는 여러 프로세스 실행 중이면 문제!**

---

### 4.3 기능 통합 테스트

**1. 파일 업로드 테스트:**
```bash
# 샘플 파일 생성
python create_sample.py
```
- [ ] 샘플 엑셀 파일 업로드
- [ ] 파일 인식 성공
- [ ] Steps와 Expected Result 컬럼 감지

**2. API 키 설정 테스트:**
- [ ] 환경설정 버튼 클릭
- [ ] API 키 입력 및 저장
- [ ] 프로그램 재시작 후 API 키 유지

**3. 번역 테스트:**
- [ ] 번역 시작 버튼 클릭
- [ ] 진행률 표시 정상
- [ ] 번역 완료 (10개 셀 기준 10-30초)
- [ ] 결과 파일 다운로드
- [ ] 다운로드 폴더에서 파일 확인
- [ ] 엑셀 파일 열어서 번역 결과 확인

**4. 종료 테스트:**
- [ ] 닫기 버튼(X) 클릭
- [ ] 프로그램 즉시 종료 (2초 이내)
- [ ] 백그라운드 프로세스 모두 종료
- [ ] 오류 팝업 없음

---

### 4.4 재시작 테스트

- [ ] 프로그램 종료 후 즉시 재실행
- [ ] 정상 실행 (포트 충돌 없음)
- [ ] 이전 설정 유지 확인

---

### 4.5 언인스톨 테스트

```
Windows 설정 > 앱 > TestGPT TC Translator > 제거
```

- [ ] 정상적으로 제거됨
- [ ] 프로그램 폴더 삭제됨
- [ ] 바탕화면 아이콘 삭제됨
- [ ] 시작 메뉴에서 제거됨

---

## 🟣 5단계: 성능 및 안정성 검증

### 5.1 성능 테스트

**대용량 파일 테스트:**
- [ ] 100개 이상 행 엑셀 파일 업로드
- [ ] 번역 완료 (시간 측정)
- [ ] 메모리 누수 없음 (작업 관리자)
- [ ] 프로그램 응답 정상

**연속 작업 테스트:**
- [ ] 파일 3개 연속 번역
- [ ] 각 번역 사이 정상 동작
- [ ] 메모리 사용량 안정적

---

### 5.2 에러 처리 테스트

**잘못된 파일:**
- [ ] 텍스트 파일(.txt) 업로드 시 에러 메시지
- [ ] 빈 엑셀 파일 업로드 시 에러 메시지
- [ ] 컬럼 없는 파일 업로드 시 에러 메시지

**API 에러:**
- [ ] API 키 없이 번역 시도 → 에러 메시지
- [ ] 잘못된 API 키 → 명확한 에러 메시지
- [ ] 네트워크 끊긴 상태 → 적절한 에러 메시지

---

## 📋 빌드 완료 체크리스트

**최종 확인:**
- [ ] 모든 위 테스트 통과
- [ ] 설치 파일 크기 정상 (80-120MB)
- [ ] 실행 속도 정상 (1분 이내 시작)
- [ ] 메모리 사용량 정상 (300MB 이하)
- [ ] 모든 기능 정상 작동
- [ ] 에러 팝업 없음
- [ ] 프로그램 종료 정상

**배포 준비:**
- [ ] 설치 파일명 확인: `TestGPT TC Translator Setup v[버전].exe`
- [ ] 버전 정보 확인 (package.json)
- [ ] README.md 업데이트
- [ ] 사용자 가이드 문서 준비

---

## 🚨 문제 발생 시 대응

### 프로그램이 시작되지 않는 경우

**증상:** 설치 후 1분 이상 창이 안 뜸

**확인:**
1. 작업 관리자에서 프로세스 확인
2. `C:\Users\[사용자]\AppData\Local\Programs\testgpt-tc-translator\resources\` 폴더 확인
3. Flask 실행 파일 존재 확인

**해결:**
```bash
# 빌드 폴더 완전 삭제 후 재빌드
rmdir /s /q dist
rmdir /s /q build
build_installer.bat
```

---

### 메모리 사용량이 비정상적으로 높은 경우

**증상:** 1GB 이상 메모리 사용

**원인:**
- Flask 서버 무한 재시작
- 메모리 누수
- 중복 프로세스 실행

**해결:**
1. 모든 프로세스 종료
2. 로그 확인 (콘솔 출력)
3. main.js의 `waitForFlaskServer` 함수 확인

---

### 번역이 작동하지 않는 경우

**확인:**
1. 네트워크 연결
2. API 키 설정
3. Flask 서버 실행 상태
4. 브라우저 콘솔 에러 (Ctrl + Shift + I)

**해결:**
- API 키 재입력
- 프로그램 재시작
- 방화벽 확인

---

## 📊 성능 벤치마크 (정상 범위)

| 항목 | 정상 범위 | 경고 | 문제 |
|------|-----------|------|------|
| 프로그램 시작 시간 | 5-30초 | 30-60초 | 60초 이상 |
| 메모리 사용량 (유휴) | 100-300MB | 300-500MB | 500MB 이상 |
| 메모리 사용량 (번역 중) | 200-400MB | 400-600MB | 600MB 이상 |
| 번역 속도 (10개 셀) | 10-30초 | 30-60초 | 60초 이상 |
| 설치 파일 크기 | 80-120MB | 120-150MB | 150MB 이상 |
| 설치 시간 | 30초-2분 | 2-5분 | 5분 이상 |

---

## ✅ 빌드 승인 기준

**모든 항목이 "정상"이어야 배포 가능:**

- [ ] 개발 모드 테스트 모두 통과
- [ ] 설치 파일 정상 생성
- [ ] 프로그램 시작 시간 60초 이내
- [ ] 메모리 사용량 500MB 이하
- [ ] 모든 핵심 기능 작동
- [ ] 에러 처리 정상
- [ ] 프로그램 종료 정상
- [ ] 성능 벤치마크 정상 범위

**하나라도 실패하면 재빌드 필요!**

---

## 📝 버전 기록

- **v1.0.0** (2026-02-02): 초기 체크리스트 작성
- 다음 빌드 시 이슈 추가

---

**작성자:** GitHub Copilot  
**목적:** 빌드 전 품질 보증 및 문제 조기 발견
