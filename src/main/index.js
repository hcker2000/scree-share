import { app, shell, BrowserWindow, ipcMain, desktopCapturer, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { uIOhook } from 'uiohook-napi'
import '../renderer/scss/styles.scss'

function createControlWindow() {
  const window = new BrowserWindow({
    width: 400,
    height: 400,
    show: false,
    resizable: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  window.on('ready-to-show', () => {
    // controlWindow.show()
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

function createVideoWindow() {
  let isDragging = false
  let initialMousePosition = null
  let initialWindowPosition = null

  const window = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  window.on('ready-to-show', () => {
    // mainWindow.show()
    window.webContents.send('resizeWindow', window.getSize())
  })

  window.on('resize', () => {
    window.webContents.send('resizeWindow', window.getSize())
  })

  window.on('mousedown', (event) => {
    if (event.button === 0) {
      // Left mouse button
      isDragging = true
      initialMousePosition = { x: event.x, y: event.y }
      initialWindowPosition = { x: window.getPosition()[0], y: window.getPosition()[1] }
    }
  })

  window.on('mousemove', (event) => {
    if (isDragging) {
      const deltaX = event.x - initialMousePosition.x
      const deltaY = event.y - initialMousePosition.y
      const newX = initialWindowPosition.x + deltaX
      const newY = initialWindowPosition.y + deltaY
      window.setPosition(newX, newY)
    }
  })

  window.on('mouseup', () => {
    isDragging = false
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'allow' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../../src/renderer/video.html'))
  }
  return window
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  let mousePosition = 0

  uIOhook.start()
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createControlWindow()
  })

  let controlWindow = createControlWindow()
  let videoWindow = createVideoWindow()

  controlWindow.show()

  controlWindow.on('close', () => {
    videoWindow.close()
  })

  ipcMain.on('showVideoWindow', () => {
    videoWindow.show()
  })
  ipcMain.on('setVideoSource', (event, arg) => {
    videoWindow.webContents.send('getVideoSource', arg)
  })
  ipcMain.on('setQuad', (event, arg) => {
    videoWindow.webContents.send('getQuad', arg)
  })
  ipcMain.on('hideVideoWindow', () => {
    videoWindow.hide()
  })

  uIOhook.on('mousemove', (event) => {
    mousePosition = event
    // videoWindow.webContents.send('getMousePosition', mousePosition)
  })

  globalShortcut.register('Alt+CommandOrControl+R', () => {
    videoWindow.webContents.send('getMousePosition', mousePosition)
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
ipcMain.handle('getSources', async () => {
  return await desktopCapturer.getSources({ types: ['window', 'screen'] })
})

ipcMain.handle('getOperatingSystem', () => {
  return process.platform
})