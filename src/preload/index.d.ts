declare global {
  interface Window {
    API: {
      getAppVersion: () => Promise<string>
      debugLog: (message: unknown) => Promise<void>
      closeApp: () => Promise<void>
      minimizeWindow: () => Promise<void>
      toggleMaxWindow: () => Promise<void>
      getWindowSize: () => Promise<{ width: number; height: number }>
      resizeWindow: (width: number, height: number) => Promise<void>
    }
  }
}
