const { ipcRenderer } = require('electron')
const electron = require('electron');
// const remote = electron.remote;
// const Menu = remote.Menu;

// const InputMenu = Menu.buildFromTemplate([{
//         label: 'Cut',
//         role: 'cut',
//     }, {
//         label: 'Copy',
//         role: 'copy',
//     }, {
//         label: 'Paste',
//         role: 'paste',
//     }, {
//         type: 'separator',
//     }, {
//         label: 'Select all',
//         role: 'selectall',
//     },
// ]);

// document.addEventListener("DOMContentLoaded", function() {
//     document.body.addEventListener('contextmenu', (e) => {
//         e.preventDefault();
//         e.stopPropagation();
    
//         let node = e.target;
    
//         while (node) {
//             if (node.nodeName.match(/^(input|textarea)$/i) || node.isContentEditable) {
//                 InputMenu.popup(remote.getCurrentWindow());
//                 break;
//             }
//             node = node.parentNode;
//         }
//     });
// });

function injectMessageQueue() {
    window.electronIPC = ipcRenderer
}

injectMessageQueue()
