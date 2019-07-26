import * as c3 from "c3";
import * as d3 from "d3";
import { ipcRenderer } from "electron";
import { Process } from "./lib/process";

let logTableData: any;
let isFirstTime: boolean = true;
let processes: Process[];

ipcRenderer.on("data", (event: any, data: Array<{}>) => {
    logTableData = data;
    isFirstTime = true;
    showTable(data);
    showChart(data);
});

// For the drop down menu
ipcRenderer.on("processes", (event: any, data: Process[]) => {
    console.log(`Number of processes: ${data.length}`);
    processes = data;
    const list = document.getElementById("dropdownmenu");
    while(list.firstChild) list.removeChild(list.firstChild);
    
    const processMap = new Map<string, Process>();
    processes.forEach((process: Process) => {
        processMap.set(process.pid, process);
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.setAttribute("id", process.pid);
        a.setAttribute("class", "pid");
        const text = document.createTextNode(process.pid);
        a.appendChild(text);
        a.href = "#";
        li.appendChild(a);
        list.appendChild(li);

        document.getElementById(process.pid).addEventListener("click", (mouseEvent: MouseEvent) => {
            const pid = mouseEvent.toElement.innerHTML;
            const relevantProcess = processMap.get(pid);
            updateMetadataBox(relevantProcess);
            updateWarningBox(relevantProcess);
            updateFailureBox(relevantProcess);
        });
    });

    console.log("UL list"+list.childNodes.length);
    const mostRecentProcess = processes[processes.length - 1];
    updateMetadataBox(mostRecentProcess);
    updateWarningBox(mostRecentProcess);
    updateFailureBox(mostRecentProcess);
});

document.getElementById("logtable").addEventListener("click", () => {
    if (logTableData && isFirstTime) {
        console.log("Updated table");
        setTimeout(() => {
                showTable(logTableData);
                isFirstTime = false;
            },
            1000);
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

function updateMetadataBox(process: Process) {
    const metadataBox = document.getElementById("analysisbody3");
    const hasWebClientSessions = process.webClientSessions.length > 0;
    const metadataArray = [`Process ID: ${process.pid}`,
                            `App Version: ${process.appVersion}`,
                            `App Launch Reason: ${process.appLaunchReason}`,
                            `Web Client Sessions: ${hasWebClientSessions ? "" : "N/A"}`];
    const metadataList: string[] = [];
    metadataArray.forEach((element) => {
        metadataList.push(`<li>${element}</li>`);
    });

    if (hasWebClientSessions) {
        const webClientSessionsList: string[] = [];
        process.webClientSessions.forEach((element) => {
            webClientSessionsList.push(`<li>${element}</li>`);
        });

        metadataList.push(`<ul>${webClientSessionsList.join("")}</ul>`);
    }

    metadataBox.innerHTML = metadataList.join("");
}

function updateWarningBox(process: Process) {
    const warningBox = document.getElementById("analysisbody2");
    warningBox.innerHTML = process.warningAnalysisFormatted;
}

function updateFailureBox(process: Process) {
    const failureBox = document.getElementById("analysisbody1");
    failureBox.innerHTML = process.failureAnalysisFormatted;
}

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

function showChart(logLines: Array<{}>) {
    const nestedData = d3.nest().key((d: any) => d.date).entries(logLines);
    const cities = d3.set();
    const formattedData = nestedData.map((entry) => {
            const values = entry.values;
            const obj: any = {};
            values.forEach ((value: any) => {
                obj[value.type] = value.id;
                cities.add(value.type);
            });
            obj.date = entry.key;
            return obj;
        });

    c3.generate({
        axis: {
            x: {
                tick: {
                    count: 10,
                    format: "%Y-%m-%d %H:%M:%S",
                },
                type: "timeseries",
            },
        },
        bindto: "#charting-area",
        data: {
            json: formattedData,
            keys: {
                value: cities.values(),
                x: "date", // it's possible to specify 'x' when category axis
            },
            type: "scatter",
            xFormat: "%Y-%m-%d %H:%M:%S",
        },
    });

    document.getElementById("charting-area").style.position = "fixed";
    document.getElementById("charting-area").style.bottom = "3%";
    document.getElementById("charting-area").style.left = "3%";
    document.getElementById("charting-area").style.width = "94%";
}

document.ondragover = document.ondrop = (ev) => {
    ev.preventDefault();
};

document.body.ondrop = (ev) => {
    ipcRenderer.send("fileLocation", ev.dataTransfer.files[0].path);
    ev.preventDefault();
};
