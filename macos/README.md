# TestGPT TC Translator - macOS Build

## 📦 포함된 파일

```
macos/
├── app.py                          # Flask 서버 메인 파일
├── requirements.txt                # Python 패키지 목록
├── package.json                    # Node.js 설정
├── package-lock.json               # Node.js 의존성 잠금
├── icon.png                        # 앱 아이콘 (PNG)
├── icon.iconset/                   # macOS 아이콘 소스
├── templates/                      # HTML 템플릿
│   └── index.html
├── electron/                       # Electron 메인 프로세스
│   ├── main.js
│   └── preload.js
├── setup_venv.sh                   # Python 가상환경 설정
├── build_python.sh                 # Python 서버 빌드
├── setup_all.sh                    # 전체 자동 빌드
├── start.sh                        # 개발 서버 시작
└── translation-server-macos.spec   # PyInstaller 설정
```

## 필수 요구사항

1. **Python 3.8 이상**
   ```bash
   python3 --version
   ```

2. **Node.js 16 이상**
   ```bash
   node --version
   npm --version
   ```

3. **Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```

## 🚀 빠른 시작

### 1️⃣ macOS로 폴더 복사
Windows에서 이 `macos` 폴더 전체를 macOS로 복사하세요.

### 2️⃣ 실행 권한 부여
```bash
cd macos
chmod +x *.sh
```

### 3️⃣ ICNS 아이콘 생성
```bash
iconutil -c icns icon.iconset
```

### 4️⃣ 전체 자동 빌드
```bash
./setup_all.sh
```

## 📝 단계별 빌드

### Python 가상환경 설정
```bash
./setup_venv.sh
```

### 개발 모드 실행
```bash
./start.sh
```

### Python 서버 빌드
```bash
./build_python.sh
```

### Electron 앱 빌드
```bash
npm install
npm run dist-mac
```

## 🎯 생성되는 파일

빌드 완료 후 `dist` 폴더에 다음 파일들이 생성됩니다:

- `TestGPT TC Translator-1.0.0-arm64.dmg` - Apple Silicon (M1/M2/M3)
- `TestGPT TC Translator-1.0.0-x64.dmg` - Intel Mac
- `TestGPT TC Translator-1.0.0-universal.dmg` - Universal Binary

## ⚙️ 환경 설정

앱 실행 후 우측 상단 ⚙️ 환경설정 버튼을 클릭하여 Gemini API 키를 등록하세요.

## 🐛 문제 해결

### Python 관련 오류
```bash
# Python 버전 확인
python3 --version

# pip 업그레이드
python3 -m pip install --upgrade pip
```

### Node.js 관련 오류
```bash
# npm 캐시 정리
npm cache clean --force

# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
```

### 빌드 오류
```bash
# 이전 빌드 삭제
rm -rf dist build venv node_modules

# 처음부터 다시 시작
./setup_all.sh
```

## 📄 라이선스

Copyright © 2026 QA Bulls

