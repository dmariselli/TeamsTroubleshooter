import { ipcRenderer } from "electron";

ipcRenderer.on("data", (event: any, data: Array<{}>) => {
    showTable(data);
});

ipcRenderer.on("debugData", (event: any, data: string[]) => {
    // tslint:disable-next-line: no-console
    if (data.length > 0) {
        data.forEach((logLine) => {
            console.log(logLine);
        });
    }
});

function showTable(logLines: Array<{}>) {
    const Tabulator = require("tabulator-tables");
    const table = new Tabulator("#logs-table", {
        autoResize: true,
        columns: [
            {title: "Date", field: "date"},
            {title: "PID", field: "pid"},
            {title: "Type", field: "type"},
            {title: "Message", field: "message"},
        ],
        groupBy: "pid",
        groupStartOpen: true,
    });

    table.setData(logLines);
}

document.ondragover = document.ondrop = (ev) => {
    ev.preventDefault();
};

document.body.ondrop = (ev) => {
    ipcRenderer.send("fileLocation", ev.dataTransfer.files[0].path);
    ev.preventDefault();
};
