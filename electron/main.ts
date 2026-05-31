import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  dialog,
  nativeImage,
  shell,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
// __dirname is globally available in CommonJS target




const IS_DEV = process.env.NODE_ENV === 'development';
const PROD_URL = process.env.MINERVA_APP_URL ?? 'https://minerva-os.vercel.app';
const APP_URL = IS_DEV ? 'http://localhost:3000' : PROD_URL;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function getIconPath() {
  return path.join(__dirname, 'assets', 'icon.png');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0A0D14',
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    show: false,
  });

  mainWindow.loadURL(`${APP_URL}/app/dashboard`);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(getIconPath()).resize({ width: 16, height: 16 });
  tray = new Tray(icon);

  const menu = Menu.buildFromTemplate([
    { label: 'Open Minerva OS', click: () => mainWindow ? mainWindow.focus() : createWindow() },
    { type: 'separator' },
    { label: 'Dashboard', click: () => mainWindow?.loadURL(`${APP_URL}/app/dashboard`) },
    { label: 'Pipeline', click: () => mainWindow?.loadURL(`${APP_URL}/app/pipeline`) },
    { label: 'Clients', click: () => mainWindow?.loadURL(`${APP_URL}/app/clients`) },
    { label: 'Projects', click: () => mainWindow?.loadURL(`${APP_URL}/app/projects`) },
    { label: 'Billing', click: () => mainWindow?.loadURL(`${APP_URL}/app/billing`) },
    { label: 'Tickets', click: () => mainWindow?.loadURL(`${APP_URL}/app/tickets`) },
    { type: 'separator' },
    { label: `Version ${app.getVersion()}`, enabled: false },
    { label: 'Quit', click: () => app.quit() },
  ]);

  tray.setToolTip('Minerva OS');
  tray.setContextMenu(menu);
  tray.on('double-click', () => mainWindow ? mainWindow.focus() : createWindow());
}

// Register minerva:// deep link protocol
if (!IS_DEV) {
  app.setAsDefaultProtocolClient('minerva');
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  if (!IS_DEV) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  // Keep app running in tray on macOS
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Handle deep links on macOS (e.g. minerva://app/clients/UUID)
app.on('open-url', (_event, url) => {
  const parsed = url.replace('minerva://', '/');
  // Validate path to prevent open-redirect: must start with /app or /portal
  const safePath = (parsed.startsWith('/app/') || parsed.startsWith('/portal/')) ? parsed : '/app/dashboard';
  if (mainWindow) {
    mainWindow.loadURL(`${APP_URL}${safePath}`);
    mainWindow.focus();
  } else {
    createWindow();
    // mainWindow is assigned by createWindow(); load URL once it's ready
    setTimeout(() => mainWindow?.loadURL(`${APP_URL}${safePath}`), 100);
  }
});

// ── IPC Handlers ──────────────────────────────────────────────────────────────

ipcMain.handle('show-open-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
      { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt'] },
    ],
  });
  return result.canceled ? null : result.filePaths;
});

ipcMain.handle('check-for-updates', () => {
  if (!IS_DEV) autoUpdater.checkForUpdatesAndNotify();
  return { checking: true };
});

ipcMain.handle('get-app-version', () => app.getVersion());

// ── Auto-updater events ────────────────────────────────────────────────────────

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update-available', info);
});

autoUpdater.on('error', (err) => {
  console.error('Auto-updater error:', err);
});
