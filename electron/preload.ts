import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('show-open-dialog'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  getVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),
  platform: process.platform,
  onUpdateAvailable: (cb: (info: unknown) => void) =>
    ipcRenderer.on('update-available', (_event, info) => cb(info)),
  onNativeNotification: (cb: (data: unknown) => void) =>
    ipcRenderer.on('native-notification', (_event, data) => cb(data)),
});
