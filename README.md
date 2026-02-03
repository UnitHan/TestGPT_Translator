# 테스트 케이스 번역 도구

LLM 기반 앱 테스트 케이스 전문 번역 Electron 데스크톱 애플리케이션입니다.

## 주요 기능

- 🖥️ **Electron 데스크톱 앱** (Windows 인스톨러 제공)
- 📁 **엑셀 파일 업로드** (드래그 앤 드롭 지원)
- 🤖 **Google Gemini AI** 활용한 전문 번역 (QA 엔지니어 페르소나)
- 📊 **실시간 진행률** 표시
- ⏱ **예상 소요 시간** 계산
- 💾 **번역 완료 파일** 다운로드
- 🔐 **API Key 암호화 저장** (SHA-256 솔트 해시)
- ⚙️ **환경설정 UI** (API 키 관리)

## 빠른 시작

### 1. 전체 초기 설정 (처음 한 번만)

```bash
setup_all.bat
```

이 스크립트가 자동으로:
- Python venv 가상환경 생성 및 패키지 설치
- 샘플 엑셀 파일 생성
- Node.js 패키지 설치
- 모든 준비를 완료합니다

### 2. 앱 실행

```bash
start.bat
```

또는

```bash
npm start
```

### 3. API 키 설정

1. 앱 실행 후 우측 상단 **⚙️ 환경설정** 버튼 클릭
2. [Google AI Studio](https://aistudio.google.com/app/apikey)에서 Gemini API 키 발급
3. API 키 입력 후 **💾 저장** 클릭
4. API 키는 암호화되어 안전하게 저장됩니다

## 인스톨러 빌드

독립 실행 가능한 Windows 설치 파일(.exe)을 만들려면:

### NSIS 인스톨러 (권장)

```bash
# 1. 서버 빌드 + Standalone 패키지 + NSIS 인스톨러 생성
npm run dist-installer

# 또는 단계별 실행
npm run dist                    # Standalone 패키지 생성
build_installer_nsis.bat        # NSIS 인스톨러 빌드
```

**결과물**: `TestGPT-TC-Translator-Setup-1.0.0.exe` (40-60MB)

**사전 요구사항**: [NSIS 3.x](https://nsis.sourceforge.io/Download) 설치 필요

### Electron 인스톨러

```bash
npm run dist-electron
```

빌드된 인스톨러는 `dist/` 폴더에 생성됩니다.

**중요**: 
- Python이 설치되지 않은 PC에서도 실행 가능합니다
- 모든 의존성이 포함된 독립 실행 파일입니다
- 인터넷 연결 없이도 설치 가능합니다 (API 사용 시에만 인터넷 필요)

## 사용 방법

1. **샘플 파일 확인**: 루트 폴더의 `한국어 테스트케이스.xlsx` 참조
2. **파일 선택**: 엑셀 파일을 드래그하거나 클릭하여 선택
3. **번역 시작**: "번역 시작" 버튼 클릭
4. **진행 확인**: 실시간으로 진행률과 예상 시간 확인
5. **다운로드**: 번역 완료 후 파일 다운로드

## 지원 형식

- **입력**: Excel 파일 (.xlsx, .xls)
- **번역 대상 열**:
  - Steps (테스트 단계)
  - Expected Result (예상 결과)

## 폴더 구조

```
translation/
├── electron/              # Electron 메인 프로세스
│   ├── main.js           # 메인 프로세스 (API 키 암호화 관리)
│   └── preload.js        # 프리로드 스크립트
├── templates/
│   └── index.html        # 프론트엔드 UI (설정 모달 포함)
├── build/                # 빌드 리소스 (아이콘 등)
├── venv/                 # Python 가상환경
├── uploads/              # 업로드된 파일 (자동 생성)
├── outputs/              # 번역된 파일 (자동 생성)
├── app.py                # Flask 백엔드 서버
├── package.json          # Node.js 설정 및 빌드 스크립트
├── requirements.txt      # Python 패키지 목록
├── create_sample.py      # 샘플 엑셀 파일 생성 스크립트
├── setup_venv.bat        # venv 설정 스크립트
├── setup_all.bat         # 전체 초기 설정 스크립트
├── start.bat             # 앱 실행 스크립트
└── README.md             # 이 파일
```

## 기술 스택

- **Desktop**: Electron (메인 + 렌더러 프로세스)
- **백엔드**: Flask (Python)
- **프론트엔드**: HTML, CSS, JavaScript
- **AI**: Google Gemini 1.5 Flash
- **데이터 처리**: Pandas, OpenPyXL
- **보안**: electron-store (암호화), crypto (SHA-256 해시)

## 보안 기능

### API 키 암호화 저장
- **electron-store**: 자체 암호화 기능으로 API 키 저장
- **SHA-256 해시**: 무결성 검증용 해시 추가 저장
- **영구 저장**: PC 재부팅 후에도 API 키 유지
- **안전한 전달**: 환경변수를 통해 Flask 서버에 전달

### 수동 설정 (개발자용)

#### 1. venv 가상환경 설정

```bash
setup_venv.bat
```

#### 2. 샘플 파일 생성

```bash
venv\Scripts\activate
python create_sample.py
```

#### 3. Node.js 패키지 설치

```bash
npm install
```

#### 4. 개발 모드 실행

```bash
npm start
```

## 문제 해결

### 빌드 오류 - "PermissionError: 액세스가 거부되었습니다"

**원인**: translation-server.exe가 실행 중일 때 빌드를 시도한 경우

**해결 방법**:

```bash
# 방법 1: 자동 종료 (권장)
kill_server.bat

# 방법 2: 수동 종료
# 작업 관리자에서 translation-server.exe 프로세스 종료

# 방법 3: 명령어로 종료
taskkill /F /IM translation-server.exe
```

**참고**: `build_complete.bat` 또는 `npm run dist`는 자동으로 프로세스를 종료합니다.

### API 키 관련
- 앱 내 환경설정 메뉴에서 API 키를 등록하세요
- API 키는 자동으로 암호화되어 저장됩니다

### 포트 충돌
- Flask 서버가 5000번 포트를 사용합니다
- 포트 변경이 필요하면 `app.py`와 `electron/main.js` 수정

### 빌드 오류
- Node.js와 Python이 올바르게 설치되어 있는지 확인
- `setup_all.bat`을 실행하여 모든 의존성 재설치

### 엑셀 파일 읽기 오류
- 엑셀 파일이 손상되지 않았는지 확인
- Steps 또는 Expected Result 열 이름이 정확한지 확인
- 샘플 파일(`한국어 테스트케이스.xlsx`)을 참조하세요

## 라이선스

MIT License
