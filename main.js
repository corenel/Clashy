const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const {
    BRG_MSG_START_CLASH,
    BRG_MSG_ADD_SUBSCRIBE,
    BRG_MSG_UPDATE_SUBSCRIBE,
    BRG_MSG_FETCH_PROFILES,
    BRG_MSG_SWITCHED_PROFILE,
    BRG_MSG_SWITCHED_PROXY,
    BRG_MSG_DELETE_SUBSCRIBE,
    BRG_MSG_OPEN_CONFIG_FOLDER,
    BRG_MSG_OPEN_LINK,
    BRG_MSG_GET_LOGIN_ITEM,
    BRG_MSG_SET_LOGIN_ITEM,
    BRG_MSG_GET_CLASHY_CONFIG,
    BRG_MSG_SET_SYSTEM_PROXY,
    BRG_MSG_CHECK_DELAY,
    BRG_MSG_SET_MINIMIZED
} = require('./src/native-support/message-constants')
const { IPCCalls } = require('./src/native-support/ipc-calls')
const { ClashBinary, utils } = require('./src/native-support')
const { openConfigFolder, openLink, getStartWithSystem, setStartWithSystem, setAsSystemProxy, restorePortSettings } = require('./src/native-support/os-helper')
const { initializeTray, destroyTrayIcon, setWindowInstance } = require('./src/native-support/tray-helper')
const { injectContextMenu } = require('./src/native-support/context-menu')
const path = require('path')
const { addSubscription, deleteSubscription, updateSubscription } = require('./src/native-support/subscription-updater')
const { fetchProfiles } = require('./src/native-support/profiles-manager')
const { setProfile, setProxy, getCurrentConfig, initialConfigsIfNeeded, setLaunchMinimized } = require('./src/native-support/configs-manager')
const { batchRequestDelay } = require('./src/native-support/check-delay')
const { isWindows, isLinux } = require('./src/native-support/utils')
const { autoUpdater } = require('electron-updater')
const { curry } = require('./src/utils/curry')

// Global reference for window object to prevent it from being GCed.
let win

function createWindow() {
    if (process.platform === 'linux') {
        Menu.setApplicationMenu(null)
    }

    win = new BrowserWindow({
        width: 800,
        height: 600,
        titleBarStyle: isWindows() ? 'default' : 'hiddenInset',
        frame: !(isWindows() || isLinux()),
        webPreferences: {
            preload: path.join(__dirname, 'src', 'native-support', 'electron-preload.js'),
            webSecurity: false
        },
        icon: path.join(__dirname, 'src', 'assets', 'icon.png')
    })
    win.setFullScreenable(false)
    win.setResizable(false)
    win.removeMenu()
    win.on('restore', event => {
        if (app.dock != null) {
            app.dock.show()
        }
    })
    win.on('close', event => {
        if (app.dock != null) {
            app.dock.hide()
        }
        win.hide()
    })
    // 然后加载应用的 index.html。

    if (utils.isElectronDebug()) {
        win.loadURL('http://localhost:3000')
        win.webContents.openDevTools()
    } else {
        win.loadFile('index.html')
    }

    injectContextMenu(win)

    win.on('closed', () => {
        win = null
    })
    return win
}

const singleInstanceLock = app.requestSingleInstanceLock()
if (!singleInstanceLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (win != null && win.isDestroyed()) {
            win.show()
        }
        if (app != null && app.dock != null) {
            app.dock.show()
        }
      })
    
    app.on('ready', () => {
        autoUpdater.checkForUpdatesAndNotify();
        initialConfigsIfNeeded().then(() => {
            const config = getCurrentConfig() || {}
            if (!config.launchMinimized) {
                createWindow()
            } else {
                if (app.dock != null) {
                    app.dock.hide()
                }
            }
            ClashBinary.spawnClash()
            setMainMenu()
            initializeTray(win, createWindow)
            setAsSystemProxy(config.systemProxy, false)
            setTimeout(restorePortSettings, 2000)
        }).catch(e => {
            console.error(e)
        })
    })
}

app.on('window-all-closed', () => {
})

app.on('activate', () => {
    if (win === null) {
        createWindow()
        setWindowInstance(win)
    }
})

app.on('will-quit', () => {
    setAsSystemProxy(false, false)
    destroyTrayIcon()
    ClashBinary.killClash()
})

ipcMain.on('IPC_MESSAGE_QUEUE', (event, args) => {
    dispatchIPCCalls(args)
})

function dispatchIPCCalls(event) {
    switch (event.__name) {
        case BRG_MSG_START_CLASH:
            ClashBinary.spawnClash()
            break
        case BRG_MSG_ADD_SUBSCRIBE:
            addSubscription(event.arg).then(() => {
                resolveIPCCall(event, event.__callbackId)
            }).catch(e => {
                console.error(e)
                deleteSubscription(event.arg)
                    .catch(e => console.log(e))
                    .finally(() => {
                        rejectIPCCall(event, event.__callbackId, e)
                    })
            })
            break
        case BRG_MSG_UPDATE_SUBSCRIBE:
            updateSubscription(event.arg).then(() => {
                resolveIPCCall(event, event.__callbackId)
            }).catch(e => {
                console.error(e)
                rejectIPCCall(event, event.__callbackId, e)
            })
            break
        case BRG_MSG_FETCH_PROFILES:
            fetchProfiles().then((result) => {
                resolveIPCCall(event, event.__callbackId, result)
            }).catch(e => {
                rejectIPCCall(event, event.__callbackId, e)
            })
            break
        case BRG_MSG_SWITCHED_PROFILE:
            setProfile(event.arg)
            resolveIPCCall(event, event.__callbackId, null)
            break
        case BRG_MSG_SWITCHED_PROXY:
            setProxy(event.selector, event.proxy)
            resolveIPCCall(event, event.__callbackId, null)
            break
        case BRG_MSG_DELETE_SUBSCRIBE:
            deleteSubscription(event.arg)
                .then(() => {
                    if (event.arg === getCurrentConfig().currentProfile) {
                        setProxy('', '')
                    }
                    resolveIPCCall(event, event.__callbackId, {})
                })
                .catch(e => rejectIPCCall(event, event.__callbackId, e))
            break
        case BRG_MSG_OPEN_CONFIG_FOLDER:
            openConfigFolder()
            break
        case BRG_MSG_OPEN_LINK:
            openLink(event.arg)
            break
        case BRG_MSG_GET_LOGIN_ITEM:
            resolveIPCCall(event, event.__callbackId, getStartWithSystem())
            break
        case BRG_MSG_SET_LOGIN_ITEM:
            setStartWithSystem(event.arg)
            resolveIPCCall(event, event.__callbackId, null)
            break
        case BRG_MSG_GET_CLASHY_CONFIG:
            resolveIPCCall(event, event.__callbackId, getCurrentConfig())
            break
        case BRG_MSG_SET_SYSTEM_PROXY:
            setAsSystemProxy(event.arg)
            resolveIPCCall(event, event.__callbackId, null)
            break
        case BRG_MSG_SET_MINIMIZED:
            setLaunchMinimized(event.arg)
            resolveIPCCall(event, event.__callbackId, null)
            break
        case BRG_MSG_CHECK_DELAY:
            batchRequestDelay(event.arg)
                .then(results => {
                    resolveIPCCall(event, event.__callbackId, results)
                })
                .catch(e => {
                    rejectIPCCall(event, event.__callbackId, e)
                })
            break
        default: {
            const call = IPCCalls[event.__name]
            const resolve = curry(resolveIPCCall)(event)(event.__callbackId)
            const reject = curry(rejectIPCCall)(event)(event.__callbackId)
            if (call) {
                call(event).then(resolve).catch(reject)
            }
            break
        }
    }
}

function resolveIPCCall(event, callbackId, result) {
    if (win == null) {
        return
    }
    win.webContents.send('IPC_MESSAGE_QUEUE', {
        __callbackId: callbackId,
        event,
        value: result
    })
}

function rejectIPCCall(event, callbackId, error) {
    if (win == null) {
        return
    }
    win.webContents.send('IPC_MESSAGE_QUEUE_REJECT', {
        __callbackId: callbackId,
        event,
        value: error
    })
}

function setMainMenu() {
    if (process.platform !== 'darwin') {
        return
    }
    const template = [
        {
            label: app.getName(),
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideothers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'close' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { role: 'copy' },
                { role: 'cut' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  }