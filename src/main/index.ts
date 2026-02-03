import { app, BrowserWindow, desktopCapturer, session } from 'electron'
import { join } from 'path'
import { electronApp } from '@electron-toolkit/utils'
import icon from './../../resources/icon.png?asset'
import { ipcMainHandlersInit } from './ipcMainHandlers'
import { loadWindowContents } from './utils'
import { Logger } from './logger'

const logger = Logger.get('MainProcess')

async function createSplashWindow(): Promise<BrowserWindow> {
  logger.debug('createSplashWindow', 'Creating splash window')

  const win = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    show: false,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  loadWindowContents(win, 'splash.html')

  win.once('ready-to-show', () => {
    win.show()
  })

  return win
}

async function createMainWindow(splashWin: BrowserWindow): Promise<BrowserWindow> {
  logger.debug('createMainWindow', 'Creating main window')

  const win = new BrowserWindow({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    closable: true,
    minimizable: true,
    frame: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/mainwin.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  loadWindowContents(win, 'mainwin.html')

  win.on('ready-to-show', () => {
    logger.debug('createMainWindow', 'Main window ready to show')
    setTimeout(() => {
      logger.debug('createMainWindow', 'Destroying splash window')
      splashWin.destroy()
    }, 500)
    setTimeout(() => {
      logger.debug('createMainWindow', 'Showing main window')
      win.show()
    }, 1000)
  })

  return win
}

const initWindows = async (): Promise<void> => {
  ipcMainHandlersInit(await createMainWindow(await createSplashWindow()))
}

const getSource = async (): Promise<Electron.DesktopCapturerSource[]> => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      fetchWindowIcons: true,
      thumbnailSize: { width: 150, height: 150 }
    })
    logger.debug('getSources', 'Fetched screen sources', sources)
    for (const source of sources) {
      logger.debug('getSources', `Source found: ${source.name} (ID: ${source.id})`)
    }
    return sources ? sources : []
  } catch (error) {
    logger.error('getSources', 'Error fetching screen sources:', error)
    return []
  }
}

const boot = async (): Promise<void> => {
  logger.info('boot', 'Starting application boot sequence')
  try {
    await app.whenReady()
    electronApp.setAppUserModelId('app.mwco.share-area-desktop')
    await initWindows()
    session.defaultSession.setDisplayMediaRequestHandler(async (_, callback) => {
      const source = await getSource()
      if (!source) return
      callback({ video: source[0] })
    })
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
  } catch (error) {
    logger.error('boot', 'Error during initialization:', error)
  }
}

boot()
