import { ipcRenderer } from "electron";

ipcRenderer.on('data', (_event: any, data: {}[]) => {
    showTable(data);
});

ipcRenderer.on('debugData', (_event: any, data: string[]) => {
    console.log(JSON.stringify(data));
});

function showTable(logLines: {}[]) {
    const Tabulator = require("tabulator-tables");
    const table = new Tabulator("#logs-table", {
        columns: [
            {title: "Date", field: "date"},
            {title: "PID", field: "pid"},
            {title: "Type", field: "type"},
            {title: "Message", field: "message"},
        ],
        groupBy: "pid",
        groupStartOpen:true,
        autoResize:true
    });

    table.setData(logLines);
}

document.ondragover = document.ondrop = (ev) => {
    ev.preventDefault();
}
  
document.body.ondrop = (ev) => {
    ipcRenderer.send('fileLocation', ev.dataTransfer.files[0].path);
    ev.preventDefault();
}
