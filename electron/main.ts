import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAccounts, saveAccount, deleteAccount } from './account-store';
import { scanRepository, updateGitignore, executePushPipeline } from './git-service';
import type { PushOptions, GitHubAccount } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const iconPath = path.join(__dirname, '../public/icon.png');

  mainWindow = new BrowserWindow({
    width: 960,
    height: 760,
    minWidth: 800,
    minHeight: 640,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#060a0c',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Open external links in the default browser instead of the Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Test active push logs
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.githubpusher.app');
  }
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

// Window controls
ipcMain.on('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window:close', () => {
  mainWindow?.close();
});

// Folder dialog
ipcMain.handle('dialog:select-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Gitリポジトリ／プロジェクトフォルダを選択',
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// Accounts store IPC
ipcMain.handle('accounts:get-all', async () => {
  return loadAccounts();
});

ipcMain.handle('accounts:save', async (_event, account: GitHubAccount) => {
  return saveAccount(account);
});

ipcMain.handle('accounts:delete', async (_event, id: string) => {
  return deleteAccount(id);
});

// Git repository operations
ipcMain.handle('git:scan-repo', async (_event, folderPath: string) => {
  return scanRepository(folderPath);
});

ipcMain.handle('fs:update-gitignore', async (_event, folderPath: string, patterns: string[]) => {
  return updateGitignore(folderPath, patterns);
});

ipcMain.handle('git:execute-push', async (_event, options: PushOptions) => {
  const accounts = loadAccounts();
  const account = accounts.find((a) => a.id === options.accountId);

  if (!account) {
    return {
      success: false,
      message: '指定されたGitHubアカウントが見つかりません。',
    };
  }

  return executePushPipeline(options, account, (log) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('git:push-log', log);
    }
  });
});

ipcMain.handle('shell:open-external', async (_event, url: string) => {
  if (url.startsWith('https://') || url.startsWith('http://')) {
    await shell.openExternal(url);
  }
});
