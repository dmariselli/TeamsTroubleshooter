import { ipcRenderer } from "electron";
import { Process } from "./lib/process";

let logTableData: any;
let isFirstTime: boolean = true;
let processes: Process[];

ipcRenderer.on("data", (event: any, data: Array<{}>) => {
    logTableData = data;
    isFirstTime = true;
    showTable(data);
});

// For the drop down menu
ipcRenderer.on("processes", (event: any, data: Process[]) => {
    console.log(`Number of processes: ${data.length}`);
    processes = data;
    const list = document.getElementById("dropdownmenu");
    processes.forEach((process: Process) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.setAttribute("id", process.pid);
        a.setAttribute("class", "pid");
        const text = document.createTextNode(process.pid);
        a.appendChild(text);
        a.href = "#";
        li.appendChild(a);
        list.appendChild(li);

        document.getElementById(process.pid).addEventListener("click", () => {
            // Daniel San to Wax on ...Wax off
        });
    });
});

document.getElementById("logtable").addEventListener("click", () => {
    if (logTableData && isFirstTime) {
        setTimeout(() => {
                showTable(logTableData);
                isFirstTime = false;
            },
            200);
    }
});


ipcRenderer.on("debugData", (event: any, data: string[]) => {
    if (data.length > 0) {
        data.forEach((logLine) => {
            console.log(logLine);
        });
    }
});

ipcRenderer.on("logToRenderer", (event: any, data: string) => {
    console.log(data);
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
