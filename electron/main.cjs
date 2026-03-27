process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
const { app, BrowserWindow, dialog, Menu, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

let backendProcess = null;
let assignedPort = 8080; // Fallback

// Helper to find a free port
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

async function startBackend() {
  const isDev = Boolean(process.env.ELECTRON_START_URL);
  
  // If not running in dev via npm run desktop:dev, find a free port.
  // In dev, Vite is on 5173 and backend is often run concurrently on 8080. 
  // But let's use dynamic port for packaged app or desktop:start.
  if (!isDev || process.env.DYNAMIC_PORT === 'true') {
      try {
          assignedPort = await getFreePort();
      } catch (err) {
          console.error("Failed to find free port, falling back to 8080", err);
      }
  }

  // Handle IPC request from frontend
  ipcMain.handle('get-backend-port', () => assignedPort);

  if (isDev && process.env.DYNAMIC_PORT !== 'true') {
    return; // Concurrently handles backend in desktop:dev
  }

  const dbPath = path.join(app.getPath('userData'), 'jira-clone.db');
  const uploadDir = path.join(app.getPath('userData'), 'uploads');
  const backendEnv = {
    ...process.env,
    DB_DRIVER: 'sqlite',
    DB_PATH: dbPath,
    UPLOAD_DIR: uploadDir,
    ALLOWED_ORIGINS: '*',
    PORT: assignedPort.toString(),
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
      preload: path.join(__dirname, 'preload.cjs')
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

app.whenReady().then(async () => {
  await startBackend();
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
