import { contextBridge, ipcRenderer, webUtils } from 'electron';
import type { RepoStatus, GitHubAccount, PushOptions, PushLog } from '../src/types';

contextBridge.exposeInMainWorld('electronAPI', {
  getPathForFile: (file: File): string => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return '';
    }
  },
  scanRepo: (folderPath: string): Promise<RepoStatus> => {
    return ipcRenderer.invoke('git:scan-repo', folderPath);
  },
  selectFolder: (): Promise<string | null> => {
    return ipcRenderer.invoke('dialog:select-folder');
  },
  getAccounts: (): Promise<GitHubAccount[]> => {
    return ipcRenderer.invoke('accounts:get-all');
  },
  saveAccount: (account: GitHubAccount): Promise<GitHubAccount[]> => {
    return ipcRenderer.invoke('accounts:save', account);
  },
  deleteAccount: (id: string): Promise<GitHubAccount[]> => {
    return ipcRenderer.invoke('accounts:delete', id);
  },
  executePush: (options: PushOptions): Promise<{ success: boolean; message: string }> => {
    return ipcRenderer.invoke('git:execute-push', options);
  },
  onPushLog: (callback: (log: PushLog) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, log: PushLog) => {
      callback(log);
    };
    ipcRenderer.on('git:push-log', handler);
    return () => {
      ipcRenderer.removeListener('git:push-log', handler);
    };
  },
  updateGitignore: (folderPath: string, patterns: string[]): Promise<boolean> => {
    return ipcRenderer.invoke('fs:update-gitignore', folderPath, patterns);
  },
  minimizeWindow: (): void => {
    ipcRenderer.send('window:minimize');
  },
  closeWindow: (): void => {
    ipcRenderer.send('window:close');
  },
  openExternal: (url: string): Promise<void> => {
    return ipcRenderer.invoke('shell:open-external', url);
  },
});
