# Ollama 로컬 LLM 통합 가이드

TestGPT TC Translator에 Ollama 로컬 LLM 지원을 추가하기 위한 완전한 가이드입니다.

---

## 📋 목차

1. [개요](#개요)
2. [Ollama 설치 및 설정](#ollama-설치-및-설정)
3. [모델 선택 가이드](#모델-선택-가이드)
4. [프로그램 통합 구현](#프로그램-통합-구현)
5. [설정 화면 구현](#설정-화면-구현)
6. [배포 및 사용자 가이드](#배포-및-사용자-가이드)
7. [문제 해결](#문제-해결)

---

## 개요

### 왜 Ollama 로컬 LLM이 필요한가?

- **보안**: 민감한 테스트케이스 데이터를 외부 네트워크로 전송하지 않음
- **프라이버시**: 회사 보안팀의 네트워크 모니터링에서 자유로움
- **오프라인**: 인터넷 없이 번역 가능
- **비용**: API 비용 없음

### 시스템 요구사항

**최소 사양:**
- RAM: 8GB 이상
- 디스크: 10GB 여유 공간
- OS: Windows 10/11, macOS 12+

**권장 사양:**
- RAM: 16GB 이상
- 디스크: 20GB 여유 공간
- GPU: 선택사항 (Intel/AMD/NVIDIA)

---

## Ollama 설치 및 설정

### Windows 설치

#### 1. Ollama 다운로드 및 설치

```batch
# 수동 설치
1. https://ollama.com/download 방문
2. Windows용 설치 파일 다운로드
3. OllamaSetup.exe 실행
4. 기본 경로로 설치 (C:\Users\[사용자]\AppData\Local\Programs\Ollama)

# 자동 설치 스크립트 (setup_ollama_windows.bat)
@echo off
chcp 65001 >nul
echo ============================================
echo Ollama 자동 설치 스크립트
echo ============================================
echo.

echo [1/3] Ollama 다운로드 중...
curl -L https://ollama.com/download/OllamaSetup.exe -o %TEMP%\OllamaSetup.exe

echo.
echo [2/3] Ollama 설치 중...
start /wait %TEMP%\OllamaSetup.exe /S

echo.
echo [3/3] 설치 확인...
timeout /t 5 /nobreak >nul
ollama --version

if %errorlevel% equ 0 (
    echo.
    echo ✓ Ollama 설치 완료!
    echo.
    echo 다음 단계: setup_ollama_model.bat 실행
) else (
    echo.
    echo ✗ 설치 실패. 수동으로 설치해주세요.
    echo https://ollama.com/download
)

pause
```

#### 2. 모델 다운로드

```batch
# setup_ollama_model.bat
@echo off
chcp 65001 >nul
echo ============================================
echo Ollama 모델 설치 스크립트
echo ============================================
echo.

echo 권장 모델을 선택하세요:
echo [1] Phi-3 Mini (2.3GB) - 가볍고 빠름, 기본 번역
echo [2] Llama 3.2 7B (4.1GB) - 권장, 고품질 번역
echo [3] Llama 3.1 8B (8.5GB) - 최고 품질
echo.

set /p choice="선택 (1-3): "

if "%choice%"=="1" (
    set MODEL=phi3:mini
    set SIZE=2.3GB
) else if "%choice%"=="2" (
    set MODEL=llama3.2:7b-instruct-q4_K_M
    set SIZE=4.1GB
) else if "%choice%"=="3" (
    set MODEL=llama3.1:8b-instruct-q4_K_M
    set SIZE=8.5GB
) else (
    echo 잘못된 선택입니다.
    pause
    exit /b 1
)

echo.
echo 선택한 모델: %MODEL% (%SIZE%)
echo 다운로드를 시작합니다... (시간이 걸릴 수 있습니다)
echo.

ollama pull %MODEL%

if %errorlevel% equ 0 (
    echo.
    echo ✓ 모델 설치 완료!
    echo.
    echo 테스트를 진행합니다...
    echo "Hello, how are you?" | ollama run %MODEL%
    echo.
    echo 프로그램 설정에서 "로컬 LLM (Ollama)" 선택 후 사용하세요.
) else (
    echo.
    echo ✗ 모델 설치 실패
)

pause
```

### macOS 설치

```bash
#!/bin/bash
# setup_ollama_macos.sh

echo "============================================"
echo "Ollama 자동 설치 스크립트 (macOS)"
echo "============================================"
echo ""

# Homebrew로 설치
if command -v brew &> /dev/null; then
    echo "[1/2] Homebrew로 Ollama 설치 중..."
    brew install ollama
else
    echo "[1/2] Ollama 수동 다운로드 중..."
    curl -L https://ollama.com/download/Ollama-darwin.zip -o /tmp/Ollama.zip
    unzip /tmp/Ollama.zip -d /Applications/
fi

echo ""
echo "[2/2] Ollama 서비스 시작..."
ollama serve &
sleep 3

echo ""
echo "✓ Ollama 설치 완료!"
echo ""
echo "다음 단계: ./setup_ollama_model.sh 실행"
```

---

## 모델 선택 가이드

### 추천 모델 비교

| 모델 | 크기 | RAM 사용 | 속도 | 번역 품질 | 추천 대상 |
|------|------|----------|------|-----------|-----------|
| **Phi-3 Mini** | 2.3GB | 4-6GB | ⚡⚡⚡ 빠름 | ⭐⭐⭐ 보통 | 저사양, 빠른 응답 필요 |
| **Llama 3.2 7B** | 4.1GB | 6-8GB | ⚡⚡ 적당 | ⭐⭐⭐⭐ 우수 | **권장** 균형잡힌 성능 |
| **Llama 3.1 8B** | 8.5GB | 10-12GB | ⚡ 느림 | ⭐⭐⭐⭐⭐ 최고 | 고사양, 최고 품질 |

### 모델별 예상 성능

**테스트 환경: i5-1135G7, 24GB RAM**

```
Step: 로그인 화면에서 아이디와 비밀번호를 입력한다
Expected Result: 로그인이 성공적으로 완료되고 메인 화면으로 이동한다

Phi-3 Mini (2.3GB):
- 번역 시간: ~3-5초
- 품질: 85%
- 출력:
  Step: Enter ID and password on the login screen
  Expected Result: Login is successfully completed and move to main screen

Llama 3.2 7B (4.1GB):
- 번역 시간: ~5-8초
- 품질: 95%
- 출력:
  Step: Enter ID and password on the login screen
  Expected Result: Login is successfully completed and navigates to the main screen

Llama 3.1 8B (8.5GB):
- 번역 시간: ~8-12초
- 품질: 98%
- 출력:
  Step: Enter the ID and password on the login screen
  Expected Result: Login completes successfully and navigates to the main screen
```

### Ollama 명령어

```bash
# 모델 목록 확인
ollama list

# 모델 다운로드
ollama pull phi3:mini
ollama pull llama3.2:7b-instruct-q4_K_M
ollama pull llama3.1:8b-instruct-q4_K_M

# 모델 삭제
ollama rm phi3:mini

# 모델 테스트
ollama run llama3.2:7b-instruct-q4_K_M

# Ollama 서버 상태 확인
curl http://localhost:11434/api/tags
```

---

## 프로그램 통합 구현

### 1. app.py 수정

#### 번역 함수 업데이트

```python
# app.py

import os
import requests
from flask import Flask, request, jsonify

# 기존 Gemini 관련 코드는 그대로 유지

def get_ollama_models():
    """Ollama 서버에서 사용 가능한 모델 목록 가져오기"""
    try:
        response = requests.get('http://localhost:11434/api/tags', timeout=2)
        if response.status_code == 200:
            models = response.json().get('models', [])
            return [model['name'] for model in models]
        return []
    except:
        return []

def check_ollama_status():
    """Ollama 서버 실행 상태 확인"""
    try:
        response = requests.get('http://localhost:11434/api/tags', timeout=2)
        return response.status_code == 200
    except:
        return False

def translate_with_ollama(text, model_name='llama3.2:7b-instruct-q4_K_M', context=""):
    """Ollama를 사용하여 번역"""
    if not text or not isinstance(text, str) or not text.strip():
        return text
    
    prompt = f"""You are a senior QA engineer with 30 years of experience in software testing and mobile app testing. 
You are an expert in translating test cases from Korean to English while maintaining technical accuracy and clarity.

Translate the following Korean test case text to English. Keep the translation:
- Professional and technically accurate
- Clear and concise
- Using proper QA/testing terminology
- Maintaining the original meaning and intent
- Preserving line breaks and formatting

{f'Context: {context}' if context else ''}

Korean text to translate:
{text}

Provide ONLY the English translation without any additional explanation or comments."""

    try:
        logger.info(f"Translating with Ollama ({model_name}): {len(text)} chars")
        
        response = requests.post(
            'http://localhost:11434/api/generate',
            json={
                'model': model_name,
                'prompt': prompt,
                'stream': False,
                'options': {
                    'temperature': 0.3,  # 일관성 있는 번역을 위해 낮게 설정
                    'top_p': 0.9,
                    'top_k': 40
                }
            },
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            translated = result.get('response', '').strip()
            logger.info(f"Translation completed ({len(translated)} chars)")
            return translated
        else:
            error_msg = f"Ollama API error: {response.status_code}"
            logger.error(error_msg)
            if translation_status['error'] is None:
                translation_status['error'] = error_msg
            return f"[Translation Error] {text}"
            
    except Exception as e:
        import traceback
        error_msg = f"{type(e).__name__}: {str(e)}"
        logger.error(f"Translation failed - {error_msg}")
        logger.debug(traceback.format_exc())
        
        if translation_status['error'] is None:
            translation_status['error'] = error_msg
        return f"[Translation Error] {text}"

def translate_with_llm(text, context=""):
    """통합 번역 함수 - 설정에 따라 Gemini 또는 Ollama 사용"""
    
    # 번역 모드 확인 (환경변수 또는 설정 파일에서)
    translation_mode = os.environ.get('TRANSLATION_MODE', 'gemini')  # 'gemini' or 'ollama'
    ollama_model = os.environ.get('OLLAMA_MODEL', 'llama3.2:7b-instruct-q4_K_M')
    
    if translation_mode == 'ollama':
        # Ollama 상태 확인
        if not check_ollama_status():
            error_msg = "Ollama server is not running"
            logger.error(error_msg)
            if translation_status['error'] is None:
                translation_status['error'] = error_msg
            return f"[Translation Error] {text}"
        
        return translate_with_ollama(text, ollama_model, context)
    else:
        # 기존 Gemini API 사용
        model = get_gemini_model()
        if not model:
            error_msg = "Gemini API model not initialized - check API key"
            logger.error(error_msg)
            return f"[Translation Error] {text}"
        
        # 기존 Gemini 번역 코드 (그대로 유지)
        # ... (기존 코드)
```

#### API 엔드포인트 추가

```python
# app.py에 추가

@app.route('/api/ollama/status', methods=['GET'])
def ollama_status():
    """Ollama 서버 상태 및 모델 목록 반환"""
    is_running = check_ollama_status()
    models = get_ollama_models() if is_running else []
    
    return jsonify({
        'running': is_running,
        'models': models,
        'recommended': [
            {'name': 'phi3:mini', 'size': '2.3GB', 'speed': 'fast', 'quality': 'good'},
            {'name': 'llama3.2:7b-instruct-q4_K_M', 'size': '4.1GB', 'speed': 'medium', 'quality': 'excellent'},
            {'name': 'llama3.1:8b-instruct-q4_K_M', 'size': '8.5GB', 'speed': 'slow', 'quality': 'best'}
        ]
    })

@app.route('/api/settings/translation-mode', methods=['POST'])
def set_translation_mode():
    """번역 모드 설정 (gemini/ollama)"""
    data = request.json
    mode = data.get('mode', 'gemini')  # 'gemini' or 'ollama'
    model = data.get('model', 'llama3.2:7b-instruct-q4_K_M')
    
    if mode not in ['gemini', 'ollama']:
        return jsonify({'error': 'Invalid mode'}), 400
    
    # 환경변수에 저장 (또는 설정 파일에 저장)
    os.environ['TRANSLATION_MODE'] = mode
    os.environ['OLLAMA_MODEL'] = model
    
    return jsonify({
        'success': True,
        'mode': mode,
        'model': model if mode == 'ollama' else None
    })

@app.route('/api/settings/translation-mode', methods=['GET'])
def get_translation_mode():
    """현재 번역 모드 가져오기"""
    mode = os.environ.get('TRANSLATION_MODE', 'gemini')
    model = os.environ.get('OLLAMA_MODEL', 'llama3.2:7b-instruct-q4_K_M')
    
    return jsonify({
        'mode': mode,
        'model': model if mode == 'ollama' else None
    })
```

---

## 설정 화면 구현

### HTML/JavaScript 수정 (templates/index.html)

```html
<!-- 설정 모달에 추가 -->

<div class="modal" id="settingsModal" style="display: none;">
    <div class="modal-content" style="max-width: 600px;">
        <h2>⚙️ 환경 설정</h2>
        
        <!-- 기존 API Key 설정은 그대로 유지 -->
        
        <!-- 번역 모드 선택 추가 -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <h3>🌐 번역 엔진 선택</h3>
            <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
                민감한 데이터는 로컬 LLM을 사용하세요 (네트워크 전송 없음)
            </p>
            
            <div class="translation-mode-selector">
                <label class="mode-option">
                    <input type="radio" name="translationMode" value="gemini" checked>
                    <div class="mode-card">
                        <div class="mode-title">🌍 Gemini API</div>
                        <div class="mode-description">
                            • 빠른 속도 (1-2초/셀)<br>
                            • 최고 품질<br>
                            • 인터넷 필요<br>
                            • API 키 필요
                        </div>
                    </div>
                </label>
                
                <label class="mode-option">
                    <input type="radio" name="translationMode" value="ollama">
                    <div class="mode-card">
                        <div class="mode-title">🔒 로컬 LLM (Ollama)</div>
                        <div class="mode-description">
                            • 네트워크 전송 없음<br>
                            • 완전한 보안/프라이버시<br>
                            • 속도 느림 (5-10초/셀)<br>
                            • Ollama 설치 필요
                        </div>
                        <div id="ollamaStatus" style="margin-top: 10px;">
                            <span class="status-checking">상태 확인 중...</span>
                        </div>
                    </div>
                </label>
            </div>
            
            <!-- Ollama 모델 선택 (Ollama 모드 선택 시에만 표시) -->
            <div id="ollamaModelSelector" style="display: none; margin-top: 20px;">
                <h4>모델 선택</h4>
                <select id="ollamaModel" style="width: 100%; padding: 10px; border: 2px solid #667eea; border-radius: 8px;">
                    <option value="">사용 가능한 모델을 불러오는 중...</option>
                </select>
                
                <div style="margin-top: 15px; padding: 15px; background: #f8f9ff; border-radius: 8px; font-size: 13px;">
                    <strong>💡 추천 모델:</strong><br>
                    • <strong>Llama 3.2 7B</strong> (4.1GB) - 권장, 고품질<br>
                    • <strong>Phi-3 Mini</strong> (2.3GB) - 빠름, 기본 번역<br>
                    <br>
                    <a href="#" onclick="showOllamaInstallGuide(); return false;" style="color: #667eea;">
                        📖 Ollama 설치 가이드 보기
                    </a>
                </div>
            </div>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 30px;">
            <button id="saveSettingsBtn" class="btn-primary">저장</button>
            <button onclick="closeSettingsModal()" class="btn-secondary">취소</button>
        </div>
    </div>
</div>

<!-- Ollama 설치 가이드 모달 -->
<div class="modal" id="ollamaGuideModal" style="display: none;">
    <div class="modal-content" style="max-width: 700px;">
        <h2>📖 Ollama 설치 가이드</h2>
        
        <div style="text-align: left; line-height: 1.8;">
            <h3>Windows 설치</h3>
            <ol>
                <li><a href="https://ollama.com/download" target="_blank">Ollama 다운로드 페이지</a> 방문</li>
                <li>Windows용 설치 파일 다운로드</li>
                <li>설치 후 명령 프롬프트(CMD) 실행</li>
                <li>다음 명령어로 모델 다운로드:<br>
                    <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 5px;">
                        ollama pull llama3.2:7b-instruct-q4_K_M
                    </code>
                </li>
                <li>다운로드 완료 후 이 프로그램에서 "로컬 LLM" 선택</li>
            </ol>
            
            <h3>macOS 설치</h3>
            <ol>
                <li>터미널에서 다음 명령어 실행:<br>
                    <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 5px;">
                        brew install ollama
                    </code>
                </li>
                <li>모델 다운로드:<br>
                    <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 5px;">
                        ollama pull llama3.2:7b-instruct-q4_K_M
                    </code>
                </li>
            </ol>
        </div>
        
        <button onclick="closeOllamaGuideModal()" class="btn-primary" style="margin-top: 20px;">닫기</button>
    </div>
</div>

<style>
.translation-mode-selector {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 20px;
}

.mode-option {
    cursor: pointer;
}

.mode-option input[type="radio"] {
    display: none;
}

.mode-card {
    padding: 20px;
    border: 2px solid #ddd;
    border-radius: 12px;
    transition: all 0.3s ease;
    background: white;
}

.mode-option input[type="radio"]:checked + .mode-card {
    border-color: #667eea;
    background: #f8f9ff;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.mode-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 10px;
    color: #333;
}

.mode-description {
    font-size: 13px;
    color: #666;
    line-height: 1.6;
}

.status-checking {
    color: #999;
    font-size: 12px;
}

.status-running {
    color: #28a745;
    font-size: 12px;
    font-weight: bold;
}

.status-not-running {
    color: #dc3545;
    font-size: 12px;
    font-weight: bold;
}

code {
    font-family: 'Courier New', monospace;
    font-size: 13px;
}
</style>

<script>
// 설정 모달 열 때 Ollama 상태 확인
async function openSettingsModal() {
    document.getElementById('settingsModal').style.display = 'flex';
    
    // 기존 API 키 관련 코드...
    
    // Ollama 상태 확인
    await checkOllamaStatus();
    
    // 현재 번역 모드 불러오기
    await loadTranslationMode();
}

async function checkOllamaStatus() {
    try {
        const response = await fetch('/api/ollama/status');
        const data = await response.json();
        
        const statusDiv = document.getElementById('ollamaStatus');
        
        if (data.running) {
            statusDiv.innerHTML = `
                <span class="status-running">✓ Ollama 실행 중</span>
                <span style="color: #666; font-size: 11px; margin-left: 10px;">
                    (모델 ${data.models.length}개 사용 가능)
                </span>
            `;
            
            // 모델 목록 업데이트
            const modelSelect = document.getElementById('ollamaModel');
            modelSelect.innerHTML = data.models.map(model => 
                `<option value="${model}">${model}</option>`
            ).join('');
            
            // 권장 모델 추가 (설치되지 않은 경우)
            if (data.models.length === 0) {
                modelSelect.innerHTML = data.recommended.map(model =>
                    `<option value="${model.name}">${model.name} (${model.size}) - ${model.quality}</option>`
                ).join('');
            }
        } else {
            statusDiv.innerHTML = `
                <span class="status-not-running">✗ Ollama가 실행되지 않았습니다</span>
                <a href="#" onclick="showOllamaInstallGuide(); return false;" 
                   style="color: #667eea; font-size: 11px; margin-left: 10px;">
                    설치 가이드
                </a>
            `;
        }
    } catch (error) {
        console.error('Ollama 상태 확인 실패:', error);
        document.getElementById('ollamaStatus').innerHTML = 
            '<span class="status-not-running">✗ 상태 확인 실패</span>';
    }
}

async function loadTranslationMode() {
    try {
        const response = await fetch('/api/settings/translation-mode');
        const data = await response.json();
        
        // 라디오 버튼 선택
        document.querySelector(`input[name="translationMode"][value="${data.mode}"]`).checked = true;
        
        // Ollama 모드면 모델 선택 표시
        if (data.mode === 'ollama') {
            document.getElementById('ollamaModelSelector').style.display = 'block';
            if (data.model) {
                document.getElementById('ollamaModel').value = data.model;
            }
        }
    } catch (error) {
        console.error('번역 모드 불러오기 실패:', error);
    }
}

// 번역 모드 라디오 버튼 변경 이벤트
document.querySelectorAll('input[name="translationMode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const isOllama = e.target.value === 'ollama';
        document.getElementById('ollamaModelSelector').style.display = isOllama ? 'block' : 'none';
    });
});

// 설정 저장
document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
    const mode = document.querySelector('input[name="translationMode"]:checked').value;
    const model = document.getElementById('ollamaModel').value;
    
    try {
        // 기존 API 키 저장 코드...
        
        // 번역 모드 저장
        const response = await fetch('/api/settings/translation-mode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode, model })
        });
        
        if (response.ok) {
            alert('설정이 저장되었습니다.');
            closeSettingsModal();
        } else {
            alert('설정 저장에 실패했습니다.');
        }
    } catch (error) {
        console.error('설정 저장 실패:', error);
        alert('설정 저장 중 오류가 발생했습니다.');
    }
});

function showOllamaInstallGuide() {
    document.getElementById('ollamaGuideModal').style.display = 'flex';
}

function closeOllamaGuideModal() {
    document.getElementById('ollamaGuideModal').style.display = 'none';
}
</script>
```

---

## 배포 및 사용자 가이드

### 관리자용 배포 가이드

#### 1. 전체 PC 일괄 설치

```batch
REM deploy_ollama_all.bat
@echo off
chcp 65001 >nul
echo ============================================
echo Ollama 일괄 배포 스크립트
echo ============================================
echo.

REM 네트워크 공유 폴더 경로 (설치 파일 위치)
set SHARE_PATH=\\server\share\ollama

echo [1/3] Ollama 설치...
start /wait %SHARE_PATH%\OllamaSetup.exe /S

echo.
echo [2/3] 기본 모델 다운로드 (Llama 3.2 7B)...
ollama pull llama3.2:7b-instruct-q4_K_M

echo.
echo [3/3] 자동 시작 설정...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "Ollama" /t REG_SZ /d "%LOCALAPPDATA%\Programs\Ollama\ollama.exe serve" /f

echo.
echo ✓ 배포 완료!
pause
```

#### 2. 사용자별 가이드 문서

```markdown
# 📘 TestGPT TC Translator - 로컬 LLM 사용 가이드

## Ollama 설치 확인

1. 시작 메뉴에서 "CMD" 또는 "명령 프롬프트" 검색
2. 다음 명령어 입력:
   ```
   ollama --version
   ```
3. 버전이 표시되면 설치 완료

## 프로그램 설정

1. TestGPT TC Translator 실행
2. 우측 상단 **⚙️ 환경설정** 버튼 클릭
3. "번역 엔진 선택" 섹션에서 **🔒 로컬 LLM (Ollama)** 선택
4. "모델 선택"에서 **llama3.2:7b-instruct-q4_K_M** 선택
5. **저장** 버튼 클릭

## 사용 방법

- 일반 데이터: Gemini API (빠름)
- 민감한 데이터: 로컬 LLM (보안)

설정에서 언제든지 변경 가능합니다.

## 문제 해결

**Q: "Ollama가 실행되지 않았습니다" 오류**
A: 시작 메뉴에서 "Ollama" 검색 후 실행

**Q: 번역이 너무 느려요**
A: 로컬 LLM은 보안을 위해 속도를 희생합니다. 빠른 번역이 필요하면 Gemini API로 전환하세요.

**Q: 모델이 없다고 나와요**
A: 명령 프롬프트에서 다음 실행:
   ```
   ollama pull llama3.2:7b-instruct-q4_K_M
   ```
```

### 자동화된 설치 패키지 생성

```batch
REM create_deployment_package.bat
@echo off
echo 배포 패키지 생성 중...

REM 배포 폴더 생성
mkdir deployment
mkdir deployment\scripts
mkdir deployment\guides

REM 스크립트 복사
copy setup_ollama_windows.bat deployment\scripts\
copy setup_ollama_model.bat deployment\scripts\

REM 가이드 문서 복사
copy USER_GUIDE.md deployment\guides\
copy TROUBLESHOOTING.md deployment\guides\

REM Ollama 설치 파일 다운로드 (선택사항)
echo Ollama 설치 파일을 deployment\ 폴더에 수동으로 추가하세요.
echo https://ollama.com/download

echo.
echo ✓ 배포 패키지 준비 완료: deployment\ 폴더
pause
```

---

## 문제 해결

### 자주 발생하는 문제

#### 1. Ollama가 실행되지 않음

**증상:** "Ollama server is not running" 오류

**해결:**
```batch
# Windows
1. 작업 관리자 실행 (Ctrl + Shift + Esc)
2. "ollama.exe" 프로세스 확인
3. 없으면 시작 메뉴에서 "Ollama" 검색 후 실행

# 또는 명령 프롬프트에서
ollama serve

# macOS
brew services start ollama
```

#### 2. 모델을 찾을 수 없음

**증상:** "Model not found" 오류

**해결:**
```bash
# 설치된 모델 확인
ollama list

# 모델이 없으면 다운로드
ollama pull llama3.2:7b-instruct-q4_K_M
```

#### 3. 번역이 매우 느림

**원인:** CPU만 사용 중

**해결:**
- GPU 드라이버 최신 버전 설치
- Ollama는 자동으로 GPU 감지 및 사용
- 확인: 작업 관리자 > 성능 > GPU 사용률 확인

#### 4. 메모리 부족 오류

**증상:** "Out of memory" 오류

**해결:**
```bash
# 더 작은 모델 사용
ollama pull phi3:mini  # 2.3GB

# 프로그램 설정에서 Phi-3 Mini 선택
```

#### 5. 연결 실패 (Connection refused)

**증상:** "Failed to connect to Ollama"

**해결:**
```bash
# Ollama 서버 재시작
# Windows
taskkill /IM ollama.exe /F
ollama serve

# macOS
brew services restart ollama
```

### 로그 확인

```batch
# Windows
echo %LOCALAPPDATA%\Ollama\logs

# macOS
~/Library/Logs/Ollama
```

### 성능 최적화

```bash
# GPU 메모리 설정 (선택사항)
# Linux/macOS: ~/.ollama/config.json
{
  "gpu_memory_fraction": 0.8,  # GPU 메모리 80% 사용
  "num_threads": 8             # CPU 스레드 수
}
```

---

## 추가 참고 자료

### Ollama 공식 문서
- 웹사이트: https://ollama.com
- GitHub: https://github.com/ollama/ollama
- 모델 라이브러리: https://ollama.com/library

### 권장 모델 상세 정보

**Phi-3 Mini**
- 개발: Microsoft
- 파라미터: 3.8B
- 특징: 매우 빠르고 가벼움
- 용도: 간단한 번역, 저사양 PC

**Llama 3.2 7B**
- 개발: Meta
- 파라미터: 7B
- 특징: 균형잡힌 성능
- 용도: 일반적인 번역 작업

**Llama 3.1 8B**
- 개발: Meta  
- 파라미터: 8B
- 특징: 최고 품질
- 용도: 고품질 번역 필요 시

### API 명령어 참고

```bash
# 모델 정보 확인
curl http://localhost:11434/api/show -d '{
  "name": "llama3.2:7b-instruct-q4_K_M"
}'

# 번역 테스트
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:7b-instruct-q4_K_M",
  "prompt": "Translate to English: 로그인 화면",
  "stream": false
}'

# 실행 중인 모델 확인
curl http://localhost:11434/api/ps
```

---

## 체크리스트

### 배포 전 확인사항

- [ ] Ollama 설치 스크립트 테스트
- [ ] 권장 모델 다운로드 확인
- [ ] 프로그램 설정 화면 테스트
- [ ] Gemini ↔ Ollama 전환 테스트
- [ ] 번역 품질 비교 테스트
- [ ] 사용자 가이드 문서 작성
- [ ] 문제 해결 가이드 작성

### 사용자 교육 체크리스트

- [ ] Ollama 설치 방법 설명
- [ ] 모델 다운로드 방법 설명
- [ ] 프로그램 설정 방법 설명
- [ ] 번역 모드 선택 기준 설명
- [ ] 문제 발생 시 대응 방법 설명

---

## 버전 관리

- **v1.0** (2026-02-02): 초기 가이드 작성
- **v1.1** (예정): 자동 설치 스크립트 추가
- **v1.2** (예정): macOS 지원 강화

---

**작성자:** GitHub Copilot  
**작성일:** 2026년 2월 2일  
**문서 목적:** 나중에 다른 환경에서 Ollama 로컬 LLM 통합을 위한 완전한 참고 자료
