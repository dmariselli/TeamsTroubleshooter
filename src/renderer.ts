import { LogLine } from "./lib/logLine";
import { ipcRenderer } from "electron";

ipcRenderer.on('data', (_event: any, data: {}[]) => {
    showTable(data);
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

    const data: any = [];
    logLines.forEach((logLine: {}) => {
        data.push(logLine);
    });

    table.setData(data);
    console.log(table);
}
