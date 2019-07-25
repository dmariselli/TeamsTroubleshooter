import { ipcRenderer } from "electron";
import { Process } from "./lib/process";

let logTableData:any;
let isFirstTime: boolean = true;
let processes: Process[];

ipcRenderer.on("data", (event: any, data: Array<{}>) => {
    logTableData = data;
    isFirstTime = true;
    showTable(data);
});

// For the drop down menu
ipcRenderer.on("processes", (event: any, data: Process[]) => {
    console.log(data.length);
    processes = data;
    var list = document.getElementById('dropdownmenu');
    processes.forEach((process: Process) => {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.setAttribute("id", process.pid);
        a.setAttribute("class", "pid");
        var text = document.createTextNode(process.pid);
        a.appendChild(text);
        a.href="#";
        li.appendChild(a);
        list.appendChild(li);

        document.getElementById(process.pid).addEventListener('click', function(){
            // Daniel San to Wax on ...Wax off
        });
    });
});

document.getElementById("logtable").addEventListener('click',function(){
    if(logTableData && isFirstTime) {
        setTimeout(() => 
            {
                showTable(logTableData);
                isFirstTime = false;
            },
            200);
    }
});


ipcRenderer.on("debugData", (event: any, data: string[]) => {
    // tslint:disable-next-line: no-console
    console.log(JSON.stringify(data));
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
