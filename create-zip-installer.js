/**
 * ZIP 배포 패키지 생성 (NSIS 없이 배포)
 * installer 폴더를 ZIP으로 압축
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const INSTALLER_DIR = path.join(__dirname, 'installer');
const OUTPUT_FILE = 'TestGPT-TC-Translator-Portable.zip';
const VERSION = require('./package.json').version;

console.log('====================================');
console.log('ZIP Portable Package Builder');
console.log('====================================');
console.log();

// 1. installer 폴더 확인
if (!fs.existsSync(INSTALLER_DIR)) {
    console.error('❌ Error: installer folder not found');
    console.error('   Run "npm run dist" first');
    process.exit(1);
}

console.log('✓ Installer folder found');
console.log();

// 2. 기존 ZIP 삭제
if (fs.existsSync(OUTPUT_FILE)) {
    console.log('Removing old ZIP file...');
    fs.unlinkSync(OUTPUT_FILE);
}

// 3. PowerShell로 ZIP 압축
console.log('Creating ZIP archive...');
console.log('This may take a few minutes...');
console.log();

try {
    const psCommand = `
        Compress-Archive -Path "${INSTALLER_DIR}\\*" -DestinationPath "${OUTPUT_FILE}" -Force
    `;
    
    execSync(`powershell -Command "${psCommand}"`, { 
        stdio: 'inherit',
        cwd: __dirname
    });
    
    console.log();
    console.log('✓ ZIP archive created');
    
} catch (error) {
    console.error('❌ Failed to create ZIP:', error.message);
    process.exit(1);
}

// 4. 결과 확인
if (fs.existsSync(OUTPUT_FILE)) {
    const stats = fs.statSync(OUTPUT_FILE);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log();
    console.log('====================================');
    console.log('✅ Success!');
    console.log('====================================');
    console.log();
    console.log(`File: ${OUTPUT_FILE}`);
    console.log(`Size: ${sizeMB} MB`);
    console.log();
    console.log('사용 방법:');
    console.log('  1. ZIP 파일을 사용자에게 전달');
    console.log('  2. 사용자가 압축 해제');
    console.log('  3. "TestGPT TC Translator.bat" 실행');
    console.log();
    console.log('장점:');
    console.log('  - 설치 불필요 (Portable)');
    console.log('  - 레지스트리 수정 없음');
    console.log('  - 관리자 권한 불필요');
    console.log();
    
} else {
    console.error('❌ ZIP file not found');
    process.exit(1);
}
