const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openSettings: () => ipcRenderer.invoke('open-settings'),
  saveApiKey: (apiKey) => ipcRenderer.invoke('save-api-key', apiKey),
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  deleteApiKey: () => ipcRenderer.invoke('delete-api-key')
});
