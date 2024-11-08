import { app, shell, BrowserWindow, ipcMain, desktopCapturer, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { uIOhook } from 'uiohook-napi'
import {
  getWindowLocation,
  setWindowLocation,
  setFollowMouse,
  getFollowMouse,
  getShowRegion,
  setShowRegion,
  getDarkMode,
  setDarkMode
} from './settings'

// import { init as initSettings } from './settings'
import '../renderer/scss/styles.scss'

function createControlWindow() {
  const windowLocation = getWindowLocation()
  const window = new BrowserWindow({
    x: windowLocation[0],
    y: windowLocation[1],
    width: 400,
    height: 415,
    show: false,
    resizable: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  })

  window.webContents.on('dom-ready', () => {
    window.webContents.send('getFollowMouse', getFollowMouse())
    window.webContents.send('getShowRegion', getShowRegion())
    window.webContents.send('getDarkMode', getDarkMode())
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/index.html`)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

function createVideoWindow() {
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
      contextIsolation: false,
      enableRemoteModule: true
    }
  })

  window.setFocusable(false)

  window.on('ready-to-show', () => {
    window.webContents.send('resizeWindow', window.getSize())
  })

  window.on('resize', () => {
    window.webContents.send('resizeWindow', window.getSize())
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'allow' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/video.html`)
  } else {
    window.loadFile(join(__dirname, '../renderer/video.html'))
  }
  return window
}

// TODO: see https://syobochim.medium.com/electron-keep-apps-on-top-whether-in-full-screen-mode-or-on-other-desktops-d7d914579fce
function createIndicatorWindow() {
  const window = new BrowserWindow({
    width: 30,
    height: 30,
    show: false,
    frame: false,
    resizable: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      // preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  })

  window.setAlwaysOnTop(true, 'screen-saver')
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'allow' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/indicator.html`)
  } else {
    window.loadFile(join(__dirname, '../renderer/indicator.html'))
  }
  return window
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // initSettings()
  let mousePosition = 0
  let settings = {
    followMouse: getFollowMouse(),
    showRegion: getShowRegion(),
    darkMode: getDarkMode()
  }

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
  let indicatorWindow = createIndicatorWindow()
  let videoWindow = createVideoWindow()

  controlWindow.show()

  controlWindow.on('close', () => {
    videoWindow.close()
    indicatorWindow.close()
    setWindowLocation(controlWindow.getPosition())
  })

  ipcMain.on('showVideoWindow', () => {
    videoWindow.show()
    if (settings.showRegion == true) {
      indicatorWindow.show()
    } else {
      indicatorWindow.hide()
    }
  })
  ipcMain.on('setVideoSource', (event, arg) => {
    videoWindow.webContents.send('getVideoSource', arg)
  })
  ipcMain.on('setQuad', (event, arg) => {
    videoWindow.webContents.send('getQuad', arg)
  })
  ipcMain.on('stopVideo', () => {
    indicatorWindow.hide()
    videoWindow.hide()
    videoWindow.webContents.send('stopVideo')
  })
  ipcMain.on('setIndicatorPosition', (event, arg) => {
    indicatorWindow.setPosition(...arg)
  })
  ipcMain.on('setFollowMouse', (event, arg) => {
    settings.followMouse = arg
    setFollowMouse(arg)
  })
  ipcMain.on('setShowRegion', (event, arg) => {
    settings.showRegion = arg
    setShowRegion(arg)
  })
  ipcMain.on('setDarkMode', (event, arg) => {
    settings.darkMode = arg
    setDarkMode(arg)
  })

  uIOhook.on('mousemove', (event) => {
    mousePosition = event

    if (settings.followMouse == true) {
      videoWindow.webContents.send('getMousePosition', mousePosition)
    }
  })

  globalShortcut.register('Alt+CommandOrControl+R', () => {
    videoWindow.webContents.send('getMousePosition', mousePosition)
  })
  globalShortcut.register('Alt+CommandOrControl+F', () => {
    if (settings.followMouse == true) {
      settings.followMouse = false
      setFollowMouse(false)
      controlWindow.webContents.send('getFollowMouse', false)
      return
    }
    settings.followMouse = true
    setFollowMouse(true)
    controlWindow.webContents.send('getFollowMouse', true)
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
