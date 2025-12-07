import { app } from 'electron'
import { is } from '@electron-toolkit/utils'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'path'
import * as yaml from 'js-yaml'
import { Logger } from './logger'

const logger = Logger.get('Utils')

const YAML_SCHEMA_URL_USERCONFIG = 'https://share-area-desktop.mwco.app/userconfig.schema.json'

type UserConfigFile = {
  theme: 'light' | 'dark'
  autoStart: boolean
}

type PartialUserConfigFile = Partial<UserConfigFile>

export const DEFAULT_USER_CONFIG: UserConfigFile = {
  theme: 'dark',
  autoStart: false
}

const ELECTRON_RENDERER_URL = process.env['ELECTRON_RENDERER_URL'] || null

export const loadWindowContents = (win: Electron.BrowserWindow, file: string): void => {
  if (is.dev && ELECTRON_RENDERER_URL) {
    logger.debug('loadWindowContents', 'Loading URL in development mode:', file)
    win.loadURL(join(ELECTRON_RENDERER_URL, file))
  } else {
    const filePath = join(__dirname, '..', 'renderer', file)
    logger.debug('loadWindowContents', 'Loading file in production mode:', filePath)
    win.loadFile(filePath)
  }
}
export const getUserDataPath = async (): Promise<string | null> => {
  const userDataPath = join(app.getPath('userData'), '..', 'share-area-desktop')
  try {
    await access(userDataPath)
    return userDataPath
  } catch (err) {
    const error = err as NodeJS.ErrnoException
    if (error.code === 'ENOENT') {
      logger.warn('getUserDataPath', 'Trying to create user data path:', userDataPath)
      try {
        await mkdir(userDataPath, { recursive: true })
        return userDataPath
      } catch (mkdirErr) {
        logger.error('getUserDataPath', 'Error creating user data path:', mkdirErr)
        return null
      }
    } else {
      logger.error('getUserDataPath', 'Error accessing user data path:', userDataPath)
      return null
    }
  }
}

export const getUserConfigPath = async (): Promise<string | null> => {
  const userDataPath = await getUserDataPath()
  if (!userDataPath) return null
  return join(userDataPath, 'config.yaml')
}

export const getUserConfig = async (): Promise<UserConfigFile> => {
  const configFilePath = await getUserConfigPath()
  if (!configFilePath) return DEFAULT_USER_CONFIG
  try {
    await access(configFilePath)
    const content = await readFile(configFilePath, 'utf8')
    const config = yaml.load(content) as UserConfigFile
    logger.debug('getUserConfig', 'User config loaded ✨', config)
    return config
  } catch (err) {
    const error = err as NodeJS.ErrnoException
    if (error.code === 'ENOENT') {
      logger.info(
        'getUserConfig',
        'No user file found, nothing special, no worries 🤷.',
        'Fallback to defaults 😇',
        configFilePath
      )
    }
    return DEFAULT_USER_CONFIG
  }
}

export const setUserConfig = async (newConfig: PartialUserConfigFile): Promise<boolean> => {
  const configFilePath = await getUserConfigPath()
  if (!configFilePath) return false
  const currentConfig = await getUserConfig()
  const updatedConfig: UserConfigFile = {
    ...DEFAULT_USER_CONFIG,
    ...currentConfig,
    ...newConfig
  }
  try {
    const yamlFromCurrentConfig = yaml.dump(updatedConfig, {
      indent: 4
    })
    const yamlStr =
      '# yaml-language-server: $schema=' +
      YAML_SCHEMA_URL_USERCONFIG +
      '---' +
      '\n' +
      yamlFromCurrentConfig
    await writeFile(configFilePath, yamlStr, 'utf8')
    logger.debug('setUserConfig', 'User config saved ✨', updatedConfig)
    return true
  } catch (err) {
    logger.error('setUserConfig', 'Error saving user config:', err)
    return false
  }
}

export const isInProductionMode = (): boolean => {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) return false
  return true
}

export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>): void => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}
