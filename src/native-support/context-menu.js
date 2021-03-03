const contextMenu = require('electron-context-menu')

let window

contextMenu({
    menu: (actions, props, browserWindow, dictionarySuggestions) => [
        ...dictionarySuggestions,
        actions.separator(),
        actions.cut(),
        actions.copy(),
        actions.paste()
    ]
});

const injectContextMenu = win => window = win 
const destroyContextMenu = () => window = null

module.exports = {
    injectContextMenu,
    destroyContextMenu
}