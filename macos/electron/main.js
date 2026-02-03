const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const Store = require('electron-store');
const crypto = require('crypto');
const http = require('http');

// 설정 저장소 (암호화된 API 키 저장)
const store = new Store({
  encryptionKey: 'testcase-translator-secret-key-v1'
});

let mainWindow;
let flaskProcess;
const FLASK_PORT = 5000;

// SHA-256 솔트 해시 암호화
function encryptApiKey(apiKey) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(apiKey, salt, 100000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

// 암호화된 키 검증 (실제 복호화는 불가능, 검증만 가능)
function verifyApiKey(apiKey, encryptedKey) {
  const [salt, originalHash] = encryptedKey.split(':');
  const hash = crypto.pbkdf2Sync(apiKey, salt, 100000, 64, 'sha256').toString('hex');
  return hash === originalHash;
}

// 실제로는 API 키를 사용하려면 평문으로 저장해야 함
// 보안과 실용성 사이의 균형을 위해 electron-store의 자체 암호화 사용
function saveApiKey(apiKey) {
  // electron-store는 자동으로 암호화하여 저장
  store.set('geminiApiKey', apiKey);
  
  // 추가 보안: SHA-256 해시도 함께 저장 (무결성 검증용)
  const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
  store.set('geminiApiKeyHash', hash);
}

function getApiKey() {
  return store.get('geminiApiKey');
}

function verifyStoredApiKey() {
  const apiKey = store.get('geminiApiKey');
  const storedHash = store.get('geminiApiKeyHash');
  
  if (!apiKey || !storedHash) return false;
  
  const currentHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  return currentHash === storedHash;
}

function createWindow() {
  // 아이콘 경로 설정 (개발/프로덕션 모드)
  const iconPath = app.isPackaged 
    ? path.join(process.resourcesPath, '../icon.ico')
    : path.join(__dirname, '../icon.ico');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: iconPath,
    autoHideMenuBar: true,
    show: false  // 준비될 때까지 창 숨김
  });

  // Flask 서버가 실제로 준비될 때까지 대기
  waitForFlaskServer().then(() => {
    mainWindow.loadURL(`http://localhost:${FLASK_PORT}`);
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });
  }).catch((error) => {
    console.error('Flask server failed to start:', error);
    dialog.showErrorBox(
      '서버 시작 실패',
      'Flask 서버를 시작할 수 없습니다.\n\n앱을 종료합니다.'
    );
    app.quit();
  });

  // 로딩 실패 처리
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    if (errorCode === -102 || errorCode === -6) {
      // CONNECTION_REFUSED 또는 FILE_NOT_FOUND
      setTimeout(() => {
        mainWindow.loadURL(`http://localhost:${FLASK_PORT}`);
      }, 1000);
    }
  });

  // 개발자 도구 (프로덕션에서는 제거)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    stopFlaskServer();
    mainWindow = null;
  });
  
  mainWindow.on('close', (event) => {
    // 창 닫기 전에 프로세스 정리
    stopFlaskServer();
  });
}

// Flask 서버가 준비될 때까지 대기하는 함수
function waitForFlaskServer(maxRetries = 60, interval = 1000) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    let consecutiveSuccesses = 0;
    const requiredSuccesses = 2; // 2번 연속 성공해야 안정적
    
    const checkServer = () => {
      // localhost와 127.0.0.1 둘 다 시도
      const url = `http://127.0.0.1:${FLASK_PORT}/status`;
      
      http.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            consecutiveSuccesses++;
            console.log(`Flask server responded (${consecutiveSuccesses}/${requiredSuccesses})`);
            
            if (consecutiveSuccesses >= requiredSuccesses) {
              console.log('Flask server is ready and stable!');
              resolve();
            } else {
              setTimeout(checkServer, 500);
            }
          } else {
            consecutiveSuccesses = 0;
            retries++;
            setTimeout(checkServer, interval);
          }
        });
      }).on('error', (err) => {
        consecutiveSuccesses = 0;
        retries++;
        
        if (retries <= maxRetries) {
          console.log(`Waiting for Flask server... (${retries}/${maxRetries})`);
          setTimeout(checkServer, interval);
        } else {
          reject(new Error('Flask server failed to start after ' + maxRetries + ' attempts'));
        }
      });
    };
    
    checkServer();
  });
}

function startFlaskServer() {
  console.log('Starting Flask server...');
  
  // 개발 모드인지 프로덕션 모드인지 확인
  const isDev = !app.isPackaged;
  console.log(`Running in ${isDev ? 'development' : 'production'} mode`);
  
  if (isDev) {
    // 개발 모드: venv의 Python으로 Flask 실행
    const isMac = process.platform === 'darwin';
    const isWindows = process.platform === 'win32';
    
    let pythonPath, appPath;
    
    if (isMac) {
      // macOS: macos 폴더의 venv 사용
      pythonPath = path.join(__dirname, '../macos/venv/bin/python3');
      appPath = path.join(__dirname, '../app.py');
    } else if (isWindows) {
      // Windows: 루트의 venv 사용
      pythonPath = path.join(__dirname, '../venv/Scripts/python.exe');
      appPath = path.join(__dirname, '../app.py');
    } else {
      // Linux
      pythonPath = path.join(__dirname, '../venv/bin/python3');
      appPath = path.join(__dirname, '../app.py');
    }
    
    console.log(`Python path: ${pythonPath}`);
    console.log(`App path: ${appPath}`);

    // API 키를 환경변수로 전달
    const apiKey = getApiKey();
    const env = { ...process.env };
    if (apiKey) {
      env.GEMINI_API_KEY = apiKey;
      console.log('API key configured');
    }

    flaskProcess = spawn(pythonPath, [appPath], {
      env: env,
      cwd: path.join(__dirname, '..')
    });
  } else {
    // 프로덕션 모드: 빌드된 실행 파일
    const isMac = process.platform === 'darwin';
    const isWindows = process.platform === 'win32';
    
    let exePath;
    
    if (isMac) {
      exePath = path.join(process.resourcesPath, 'translation-server');
    } else if (isWindows) {
      exePath = path.join(process.resourcesPath, 'translation-server.exe');
    } else {
      exePath = path.join(process.resourcesPath, 'translation-server');
    }
    
    console.log(`Server executable: ${exePath}`);
    console.log(`Resource path: ${process.resourcesPath}`);
    
    // API 키를 환경변수로 전달
    const apiKey = getApiKey();
    const env = { ...process.env };
    if (apiKey) {
      env.GEMINI_API_KEY = apiKey;
      console.log('API key configured');
    }

    const spawnOptions = {
      env: env,
      cwd: process.resourcesPath
    };
    
    // Windows에서만 콘솔 창 숨김
    if (isWindows) {
      spawnOptions.windowsHide = true;
    }

    flaskProcess = spawn(exePath, [], spawnOptions);
  }

  flaskProcess.stdout.on('data', (data) => {
    console.log(`[Flask] ${data}`);
  });

  flaskProcess.stderr.on('data', (data) => {
    console.error(`[Flask Error] ${data}`);
  });

  flaskProcess.on('error', (error) => {
    console.error(`Failed to start Flask server: ${error}`);
  });

  flaskProcess.on('close', (code) => {
    console.log(`Flask process exited with code ${code}`);
  });
}

// Flask 서버 종료 플래그 (중복 호출 방지)
let isStoppingFlask = false;

function stopFlaskServer() {
  // 이미 종료 중이면 무시
  if (isStoppingFlask) {
    console.log('Flask server is already stopping, skipping...');
    return;
  }
  
  isStoppingFlask = true;
  console.log('Stopping Flask server...');
  
  try {
    if (flaskProcess && flaskProcess.pid) {
      const pid = flaskProcess.pid;
      const isDev = !app.isPackaged;
      
      if (process.platform === 'win32') {
        // Windows에서는 taskkill로 프로세스 트리 전체를 강제 종료
        try {
          // /F: 강제 종료, /T: 자식 프로세스 포함
          exec(`taskkill /pid ${pid} /T /F`, (error) => {
            if (error && !error.message.includes('not found') && !error.message.includes('찾을')) {
              console.error('Failed to kill Flask process:', error.message);
            } else {
              console.log('Flask process killed successfully');
            }
          });
        } catch (e) {
          console.error('Error executing taskkill:', e.message);
        }
        
        // 프로덕션 모드일 때만 translation-server.exe 추가 종료
        if (!isDev) {
          try {
            exec('taskkill /IM translation-server.exe /F', (error) => {
              if (error && !error.message.includes('not found') && !error.message.includes('찾을')) {
                console.error('Failed to kill remaining processes:', error.message);
              } else if (!error) {
                console.log('All translation-server.exe processes killed');
              }
            });
          } catch (e) {
            console.error('Error killing remaining processes:', e.message);
          }
        }
      } else {
        // Unix 계열 (macOS, Linux)에서는 SIGTERM 사용
        try {
          process.kill(pid, 'SIGTERM');
          console.log('Flask process terminated');
          
          // 혹시 남아있으면 SIGKILL
          setTimeout(() => {
            try {
              process.kill(pid, 'SIGKILL');
            } catch (e) {
              // 이미 종료됨
            }
          }, 2000);
        } catch (error) {
          console.error('Error stopping Flask server:', error.message);
        }
      }
    }
  } catch (error) {
    console.error('Critical error in stopFlaskServer:', error.message);
  } finally {
    flaskProcess = null;
    // 종료 플래그 리셋 (2초 후)
    setTimeout(() => {
      isStoppingFlask = false;
    }, 2000);
  }
}

// IPC 핸들러들
ipcMain.handle('open-settings', async () => {
  return {
    hasApiKey: !!getApiKey(),
    apiKeyValid: verifyStoredApiKey()
  };
});

ipcMain.handle('save-api-key', async (event, apiKey) => {
  try {
    if (!apiKey || apiKey.trim() === '') {
      return { success: false, error: 'API 키를 입력해주세요.' };
    }
    
    saveApiKey(apiKey);
    
    // Flask 서버 재시작 (새 API 키 적용)
    stopFlaskServer();
    setTimeout(() => {
      startFlaskServer();
    }, 1000);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-api-key', async () => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  
  // 보안을 위해 마스킹된 키 반환
  const maskedKey = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
  return maskedKey;
});

ipcMain.handle('delete-api-key', async () => {
  store.delete('geminiApiKey');
  store.delete('geminiApiKeyHash');
  
  // Flask 서버 재시작
  stopFlaskServer();
  setTimeout(() => {
    startFlaskServer();
  }, 1000);
  
  return { success: true };
});

// 앱 시작
app.whenReady().then(() => {
  startFlaskServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopFlaskServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', (event) => {
  // 종료 전에 프로세스 정리 완료 대기
  stopFlaskServer();
});

app.on('will-quit', (event) => {
  // 앱이 완전히 종료되기 전 마지막 정리
  stopFlaskServer();
});

// 프로세스 종료 시그널 처리
process.on('SIGTERM', () => {
  stopFlaskServer();
  app.quit();
});

process.on('SIGINT', () => {
  stopFlaskServer();
  app.quit();
});
