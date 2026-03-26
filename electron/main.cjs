const { app, BrowserWindow, dialog, Menu } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let backendProcess = null;

function startBackend() {
  const isDev = Boolean(process.env.ELECTRON_START_URL);
  if (isDev) {
    return;
  }

  const dbPath = path.join(app.getPath('userData'), 'jira-clone.db');
  const uploadDir = path.join(app.getPath('userData'), 'uploads');
  const backendEnv = {
    ...process.env,
    DB_DRIVER: 'sqlite',
    DB_PATH: dbPath,
    UPLOAD_DIR: uploadDir,
    ALLOWED_ORIGINS: 'null,http://localhost:5173',
    PORT: process.env.PORT || '8080',
  };

  if (app.isPackaged) {
    const backendBinary = path.join(process.resourcesPath, 'backend', 'jira-backend');
    backendProcess = spawn(backendBinary, [], {
      env: backendEnv,
      stdio: 'inherit',
    });
  } else {
    const backendDir = path.join(__dirname, '..', 'backend');
    backendProcess = spawn('go', ['run', './cmd/api/main.go'], {
      cwd: backendDir,
      env: backendEnv,
      stdio: 'inherit',
    });
  }

  backendProcess.on('error', (error) => {
    dialog.showErrorBox('Backend startup failed', `Could not start Go backend: ${error.message}`);
  });
}

function createWindow() {
  Menu.setApplicationMenu(null);

  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  const indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
  mainWindow.loadFile(indexPath);
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill('SIGTERM');
  }
});
