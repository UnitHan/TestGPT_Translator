/**
 * Standalone 인스톨러 생성 스크립트
 * dist/translation-server 폴더를 압축하고 간단한 설치 스크립트 생성
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = path.join(__dirname, 'dist', 'translation-server');
const OUTPUT_DIR = path.join(__dirname, 'installer');
const VERSION = require('./package.json').version;

console.log('====================================');
console.log('Standalone Installer Builder');
console.log('====================================');
console.log();

// 1. 빌드 결과물 확인
if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Error: dist/translation-server folder not found');
    console.error('   Run "npm run build-server" first');
    process.exit(1);
}

const exePath = path.join(BUILD_DIR, 'translation-server.exe');
if (!fs.existsSync(exePath)) {
    console.error('❌ Error: translation-server.exe not found');
    process.exit(1);
}

console.log('✓ Build artifacts found');
console.log();

// 2. 출력 폴더 생성
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 3. README 파일 생성
const readmeContent = `# TestGPT TC Translator v${VERSION}

## 설치 방법

1. 이 폴더를 원하는 위치에 복사하세요
2. "TestGPT TC Translator.exe" 를 실행하세요
3. 자동으로 브라우저가 열립니다

## 사용 방법

- 프로그램을 실행하면 브라우저에서 자동으로 열립니다
- 엑셀 파일을 업로드하여 번역할 수 있습니다
- 환경설정 버튼(⚙️)에서 Gemini API 키를 설정하세요
- 콘솔 보기를 통해 서버 로그를 확인할 수 있습니다

## 종료 방법

- 실행 중인 콘솔 창에서 Ctrl+C를 누르세요
- 또는 작업 관리자에서 translation-server.exe를 종료하세요

## 로그 파일 위치

- Windows: C:\\translation_log\\translation-server.log
- 데이터: %LOCALAPPDATA%\\TestGPT-TC-Translator

## 문의

QA Bulls
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'README.txt'), readmeContent, 'utf8');
console.log('✓ README.txt created');

// 4. 시작 배치 파일 생성 (더 친절한 버전)
const startBatContent = `@echo off
chcp 65001 >nul
title TestGPT TC Translator

cls
echo ╔════════════════════════════════════════════════╗
echo ║                                                ║
echo ║       TestGPT TC Translator v${VERSION.padEnd(10)}        ║
echo ║            Test Case Translation Tool          ║
echo ║                                                ║
echo ╚════════════════════════════════════════════════╝
echo.
echo 🚀 서버를 시작합니다...
echo.
echo 📌 브라우저가 자동으로 열립니다
echo 📌 이 창을 닫으면 프로그램이 종료됩니다
echo 📌 종료하려면 Ctrl+C를 누르세요
echo.
echo ════════════════════════════════════════════════
echo.

cd /d "%~dp0translation-server"
start "" "translation-server.exe"

echo.
echo ✅ 서버가 시작되었습니다!
echo.
echo 브라우저에서 http://127.0.0.1:5000 으로 접속하세요
echo.
pause
`;

fs.writeFileSync(
    path.join(OUTPUT_DIR, 'TestGPT TC Translator.bat'),
    startBatContent,
    'utf8'
);
console.log('✓ Launcher script created');

// 5. translation-server 폴더 복사
const targetBuildDir = path.join(OUTPUT_DIR, 'translation-server');
if (fs.existsSync(targetBuildDir)) {
    console.log('Removing old build...');
    fs.rmSync(targetBuildDir, { recursive: true, force: true });
}

console.log('Copying build artifacts...');
copyDir(BUILD_DIR, targetBuildDir);
console.log('✓ Build artifacts copied');

// 6. 완료
console.log();
console.log('====================================');
console.log('✅ Standalone installer created!');
console.log('====================================');
console.log();
console.log('Output location:', OUTPUT_DIR);
console.log();
console.log('Next steps:');
console.log('  1. Open the "installer" folder');
console.log('  2. Test: Run "TestGPT TC Translator.bat"');
console.log('  3. Distribute: Zip the entire "installer" folder');
console.log();

// 헬퍼 함수: 디렉토리 복사
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
