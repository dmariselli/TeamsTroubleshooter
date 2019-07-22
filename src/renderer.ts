
var ipcRenderer = require('electron').ipcRenderer;
ipcRenderer.on('fileObject', function (event: any, data: string[]) {
    module.require("./lib/appStart").start(data[0]);
    console.log(event);
});

