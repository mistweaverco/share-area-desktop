import { app, BrowserWindow, desktopCapturer, ipcMain } from 'electron'

export const ipcMainHandlersInit = (mainWindow: BrowserWindow): void => {
  ipcMain.handle('getAppVersion', (): string => {
    return app.getVersion()
  })

  ipcMain.handle('closeApp', async (): Promise<void> => {
    app.quit()
  })

  ipcMain.handle('minimizeWindow', async (): Promise<void> => {
    mainWindow.minimize()
  })

  ipcMain.handle('debugLog', async (_, message: unknown): Promise<void> => {
    console.debug(message)
  })

  ipcMain.handle('resizeWindow', async (_, width: number, height: number): Promise<void> => {
    mainWindow.setSize(width, height)
  })

  ipcMain.handle('getWindowSize', async (): Promise<{ width: number; height: number }> => {
    const [width, height] = mainWindow.getSize()
    return { width, height }
  })

  ipcMain.handle('toggleMaxWindow', async (): Promise<void> => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
      return
    }
    mainWindow.maximize()
  })
}
