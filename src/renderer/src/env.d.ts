/// <reference types="svelte" />
/// <reference types="vite/client" />

declare global {
  interface Window {
    API: {
      getAppVersion: () => Promise<string>
      debugLog: (message: unknown) => Promise<void>
      closeApp: () => Promise<void>
      minimizeWindow: () => Promise<void>
      toggleMaxWindow: () => Promise<void>
      moveWindow: (args: { top: number; left: number }) => Promise<void>
      getScreenSources: () => Promise<Electron.DesktopCapturerSource[]>
    }
  }
}
