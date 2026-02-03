const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const Store = require('electron-store');
const crypto = require('crypto');
const http = require('http');
const net = require('net');

function getLogDir() {
  const override = process.env.TRANSLATOR_LOG_DIR;
  if (override) {
    return override;
  }
  if (process.platform === 'win32') {
    return 'C:\\translation_log';
  }
  return path.join(os.homedir(), 'translation_log');
}

const logDir = getLogDir();
let logStream = null;

function safeStringify(value) {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}

function formatLogLine(level, args) {
  const message = args.map(safeStringify).join(' ');
  return `[${new Date().toISOString()}] [${level}] ${message}\n`;
}

function initFileLogging() {
  try {
    fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, 'electron-main.log');
    logStream = fs.createWriteStream(logFile, { flags: 'a' });
  } catch (error) {
    logStream = null;
    console.error('Failed to initialize file logging:', error);
  }
}

function writeLog(level, args) {
  if (!logStream) return;
  logStream.write(formatLogLine(level, args));
}

const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error
};

console.log = (...args) => {
  originalConsole.log(...args);
  writeLog('INFO', args);
};

console.warn = (...args) => {
  originalConsole.warn(...args);
  writeLog('WARN', args);
};

console.error = (...args) => {
  originalConsole.error(...args);
  writeLog('ERROR', args);
};

process.on('uncaughtException', (error) => {
  writeLog('FATAL', [error && error.stack ? error.stack : String(error)]);
});

process.on('unhandledRejection', (reason) => {
  writeLog('FATAL', [reason && reason.stack ? reason.stack : String(reason)]);
});

initFileLogging();
console.log(`Log file: ${path.join(logDir, 'electron-main.log')}`);

// Single Instance Lock - 중복 실행 방지
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('Another instance is already running. Exiting...');
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 다른 인스턴스가 실행되려고 할 때 기존 창을 포커스
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// 설정 저장소 (암호화된 API 키 저장)
const store = new Store({
  encryptionKey: 'testcase-translator-secret-key-v1'
});

let mainWindow;
let flaskProcess;
let flaskPort = null;
const DEFAULT_FLASK_PORT = 5000;
let isQuitting = false;
let stopPromise = null;

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

function getPreferredPort() {
  const envPort = parseInt(process.env.FLASK_PORT, 10);
  if (Number.isInteger(envPort) && envPort > 0 && envPort < 65536) {
    return envPort;
  }
  return DEFAULT_FLASK_PORT;
}

function findAvailablePort(preferredPort) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.unref();
    tester.once('error', () => {
      const fallback = net.createServer();
      fallback.unref();
      fallback.once('error', () => resolve(preferredPort));
      fallback.listen(0, '127.0.0.1', () => {
        const port = fallback.address().port;
        fallback.close(() => resolve(port));
      });
    });
    tester.once('listening', () => {
      const port = tester.address().port;
      tester.close(() => resolve(port));
    });
    tester.listen(preferredPort, '127.0.0.1');
  });
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
  waitForFlaskServer(flaskPort).then(() => {
    mainWindow.loadURL(`http://127.0.0.1:${flaskPort}`);
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });
  }).catch((error) => {
    console.error('Flask server failed to start:', error);
    
    const choice = dialog.showMessageBoxSync({
      type: 'error',
      title: '서버 시작 실패',
      message: 'Flask 서버를 시작할 수 없습니다.',
      detail: `포트 ${flaskPort}이 이미 사용 중일 수 있습니다.\n\n다시 시도하시겠습니까?`,
      buttons: ['재시도', '종료'],
      defaultId: 0,
      cancelId: 1
    });
    
    if (choice === 0) {
      // 재시도
      console.log('Retrying server start...');
      stopFlaskServer().finally(() => {
        app.relaunch();
        app.exit(0);
      });
    } else {
      // 종료
      stopFlaskServer().finally(() => {
        app.quit();
      });
    }
  });

  // 로딩 실패 처리
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    if (errorCode === -102 || errorCode === -6) {
      // CONNECTION_REFUSED 또는 FILE_NOT_FOUND
      setTimeout(() => {
        mainWindow.loadURL(`http://127.0.0.1:${flaskPort}`);
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
function waitForFlaskServer(port, maxRetries = 30, interval = 1000) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    let consecutiveSuccesses = 0;
    const requiredSuccesses = 2; // 2번 연속 성공해야 안정적
    
    const checkServer = () => {
      // 최대 재시도 횟수 초과 체크 (모든 경로에서)
      if (retries >= maxRetries) {
        console.error(`Flask server failed to start after ${maxRetries} attempts`);
        reject(new Error(`Flask server failed to start after ${maxRetries} attempts`));
        return;
      }
      
      retries++;
      
      const url = `http://127.0.0.1:${port}/health`;
      
      const request = http.get(url, { timeout: 3000 }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            consecutiveSuccesses++;
            console.log(`Flask server responded (${consecutiveSuccesses}/${requiredSuccesses}), attempt ${retries}/${maxRetries}`);
            
            if (consecutiveSuccesses >= requiredSuccesses) {
              console.log('Flask server is ready and stable!');
              resolve();
            } else {
              // 재시도 전 체크
              if (retries < maxRetries) {
                setTimeout(checkServer, 500);
              } else {
                reject(new Error('Max retries reached'));
              }
            }
          } else {
            consecutiveSuccesses = 0;
            console.log(`Flask server returned status ${res.statusCode}, retrying... (${retries}/${maxRetries})`);
            setTimeout(checkServer, interval);
          }
        });
      });
      
      request.on('timeout', () => {
        console.log(`Request timeout (${retries}/${maxRetries})`);
        request.destroy();
        if (retries < maxRetries) {
          setTimeout(checkServer, interval);
        } else {
          reject(new Error('Max retries reached'));
        }
      });
      
      request.on('error', (err) => {
        consecutiveSuccesses = 0;
        console.log(`Waiting for Flask server... (${retries}/${maxRetries}) - ${err.code || err.message}`);
        
        if (retries < maxRetries) {
          setTimeout(checkServer, interval);
        } else {
          reject(new Error(`Flask server failed to start after ${maxRetries} attempts: ${err.message}`));
        }
      });
    };
    
    checkServer();
  });
}

async function startFlaskServer(port) {
  console.log('Starting Flask server...');
  console.log(`Using port ${port}`);
  
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
    const env = {
      ...process.env,
      FLASK_PORT: String(port),
      PYTHONIOENCODING: 'utf-8',
      TRANSLATOR_DATA_DIR: app.getPath('userData'),
      TRANSLATOR_LOG_DIR: logDir
    };
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
      // onedir 빌드: 폴더 안의 실행 파일
      exePath = path.join(process.resourcesPath, 'translation-server', 'translation-server.exe');
    } else {
      exePath = path.join(process.resourcesPath, 'translation-server');
    }
    
    console.log(`Server executable: ${exePath}`);
    console.log(`Resource path: ${process.resourcesPath}`);
    
    // 실행 파일 존재 확인
    if (!require('fs').existsSync(exePath)) {
      console.error(`Server executable not found: ${exePath}`);
      throw new Error(`Server executable not found: ${exePath}`);
    }
    
    // API 키를 환경변수로 전달
    const apiKey = getApiKey();
    const env = {
      ...process.env,
      FLASK_PORT: String(port),
      PYTHONIOENCODING: 'utf-8',
      TRANSLATOR_DATA_DIR: app.getPath('userData'),
      TRANSLATOR_LOG_DIR: logDir
    };
    if (apiKey) {
      env.GEMINI_API_KEY = apiKey;
      console.log('API key configured');
    }

    const spawnOptions = {
      env: env,
      cwd: process.resourcesPath,
      detached: false, // 부모 프로세스와 연결
      stdio: ['ignore', 'pipe', 'pipe'] // stdin, stdout, stderr
    };
    
    // Windows에서만 콘솔 창 숨김
    if (isWindows) {
      spawnOptions.windowsHide = true;
    }

    try {
      flaskProcess = spawn(exePath, [], spawnOptions);
    } catch (error) {
      console.error('Failed to spawn Flask process:', error);
      throw error;
    }
  }

  if (!flaskProcess) {
    throw new Error('Failed to create Flask process');
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
    if (!stopPromise) {
      flaskProcess = null;
    }
  });
}

function stopFlaskServer() {
  if (!flaskProcess) {
    return Promise.resolve();
  }
  if (stopPromise) {
    return stopPromise;
  }

  console.log('Stopping Flask server...');
  stopPromise = new Promise((resolve) => {
    const proc = flaskProcess;
    let resolved = false;

    const finalize = () => {
      if (resolved) return;
      resolved = true;
      if (flaskProcess === proc) {
        flaskProcess = null;
      }
      stopPromise = null;
      resolve();
    };

    proc.once('exit', finalize);
    proc.once('close', finalize);

    try {
      proc.kill('SIGTERM');
    } catch (error) {
      console.error('Error stopping Flask server:', error.message);
      finalize();
      return;
    }

    setTimeout(() => {
      if (!resolved) {
        try {
          proc.kill('SIGKILL');
        } catch (error) {
          // ignore
        }
        finalize();
      }
    }, 3000);
  });

  return stopPromise;
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
    await stopFlaskServer();
    await startFlaskServer(flaskPort);
    
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
  await stopFlaskServer();
  await startFlaskServer(flaskPort);
  
  return { success: true };
});

// 앱 시작
app.whenReady().then(async () => {
  const preferredPort = getPreferredPort();
  flaskPort = await findAvailablePort(preferredPort);
  console.log(`Selected port ${flaskPort}`);

  await startFlaskServer(flaskPort);
  createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (!flaskProcess) {
        await startFlaskServer(flaskPort);
      }
      createWindow();
    }
  });
});

async function gracefulQuit() {
  if (isQuitting) {
    return;
  }
  isQuitting = true;
  console.log('Quitting application, cleaning up...');
  await stopFlaskServer();
  app.exit(0);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    gracefulQuit();
  }
});

app.on('before-quit', (event) => {
  if (!isQuitting) {
    event.preventDefault();
    gracefulQuit();
  }
});

// 프로세스 종료 시그널 처리
process.on('SIGTERM', () => {
  gracefulQuit();
});

process.on('SIGINT', () => {
  gracefulQuit();
});
