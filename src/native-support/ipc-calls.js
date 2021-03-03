const { BRG_MSG_SET_PORT, BRG_MSG_MIN_WIN, BRG_MSG_CLS_WIN} = require('./message-constants')
const { setHttpPort, setSocksPort } = require('./configs-manager')
const { BrowserWindow } = require('electron')

const IPCCalls = {
    [BRG_MSG_SET_PORT]: (args) => {
        const { httpPort, socksPort } = args
        if (httpPort) {
            setHttpPort(httpPort)
        }
        if (socksPort) {
            setSocksPort(socksPort)
        }
        return Promise.resolve()
    },
    [BRG_MSG_MIN_WIN]: (args) => {
        BrowserWindow.getFocusedWindow().minimize()
        return Promise.resolve()
    },
    [BRG_MSG_CLS_WIN]: (args) => {
        BrowserWindow.getFocusedWindow().close()
        return Promise.resolve()
    }
}

module.exports = {
    IPCCalls
}