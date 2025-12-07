import { ipcRenderer } from 'electron'
import { contextBridge } from 'electron'

const API = {
  getAppVersion: async (): Promise<string> => {
    return await ipcRenderer.invoke('getAppVersion')
  },
  closeApp: async (): Promise<void> => {
    await ipcRenderer.invoke('closeApp')
  },
  debugLog: async (message: unknown): Promise<void> => {
    await ipcRenderer.invoke('debugLog', message)
  },
  minimizeWindow: async (): Promise<void> => {
    await ipcRenderer.invoke('minimizeWindow')
  },
  toggleMaxWindow: async (): Promise<void> => {
    await ipcRenderer.invoke('toggleMaxWindow')
  },
  getWindowSize: async (): Promise<{ width: number; height: number }> => {
    return await ipcRenderer.invoke('getWindowSize')
  },
  resizeWindow: async (width: number, height: number): Promise<void> => {
    await ipcRenderer.invoke('resizeWindow', width, height)
  }
}

try {
  contextBridge.exposeInMainWorld('API', API)
} catch (error) {
  console.error(error)
}
