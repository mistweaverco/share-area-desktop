import { is } from '@electron-toolkit/utils'

// Base logger methods
const Loggers = {
  log: (...args: unknown[]): void => {
    console.debug(...args)
  },
  info: (...args: unknown[]): void => {
    console.debug(...args)
  },
  warn: (...args: unknown[]): void => {
    console.warn(...args)
  },
  error: (...args: unknown[]): void => {
    console.error(...args)
  },
  debug: (...args: unknown[]): void => {
    if (!is.dev) return
    console.debug(...args)
  }
}

// Cache for created loggers
// Key: identifier, Value: logger instance
// I'm not sure if caching is getting us any performance benefit here..
const cacheLoggers = new Map<string, typeof Loggers>()

/**
 * Logger utility to create namespaced loggers.
 * @param id Optional identifier to prefix log messages.
 * @returns An object with log, warn, error, and debug methods.
 * @example
 * const logger = Logger.get('MyModule')
 * logger.log('This is a log message')
 * logger.warn('This is a warning message')
 * logger.error('This is an error message')
 * logger.debug('This is a debug message')
 */
export const Logger = {
  get: (id: string = ''): typeof Loggers => {
    // I'm not sure if caching is getting us any performance benefit here..
    // or worse, it could impact memory negatively if
    // we create too many loggers
    if (cacheLoggers.has(id)) {
      return cacheLoggers.get(id)!
    }
    const logger = {
      log: (...args: unknown[]): void => {
        args = id !== '' ? [id, ...args] : args
        Loggers.log(...args)
      },
      info: (...args: unknown[]): void => {
        args = id !== '' ? [id, ...args] : args
        Loggers.info(...args)
      },
      warn: (...args: unknown[]): void => {
        args = id !== '' ? [id, ...args] : args
        Loggers.warn(...args)
      },
      error: (...args: unknown[]): void => {
        args = id !== '' ? [id, ...args] : args
        Loggers.error(...args)
      },
      debug: (...args: unknown[]): void => {
        args = id !== '' ? [id, ...args] : args
        Loggers.debug(...args)
      }
    }
    cacheLoggers.set(id, logger)
    return logger
  }
}
