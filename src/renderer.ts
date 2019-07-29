import * as c3 from "c3";
import * as d3 from "d3";
import { ipcRenderer } from "electron";
import { ITabularCompatibleData } from "./lib/logLine";
import { Process } from "./lib/process";

let logTableData: any;
const logTable: any = createNewTable();
let processes: Process[];
let scrollToRowNumber: number = -1;
const logLineExplanations: Map<number, string> = new Map<number, string>();

enum FileType {
    txt = "txt",
    zip = "zip",
    unknown = "",
}

ipcRenderer.on("data", (event: any, data: ITabularCompatibleData[]) => {
    logTableData = data;
    setDataToTable(data);
    showChart(data);
});

// For the drop down menu
ipcRenderer.on("processes", (event: any, data: Process[]) => {
    console.log(`Number of processes: ${data.length}`);
    processes = data;
    const list = document.getElementById("dropdownmenu");
    while (list.firstChild) { list.removeChild(list.firstChild); }

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

    console.log("UL list" + list.childNodes.length);
    const mostRecentProcess = processes[processes.length - 1];
    updateMetadataBox(mostRecentProcess);
    updateWarningBox(mostRecentProcess);
    updateFailureBox(mostRecentProcess);
});

ipcRenderer.on("rowExtraData", (event: any, data: ITabularCompatibleData[]) => {
    data.forEach((explanation) => {
        logLineExplanations.set(explanation.id, explanation.message);
    });
});

$(document).on("shown.bs.tab", 'a[href="#menu2"]', (e) => {
    scrollToRow();
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

document.getElementById("copyAnalysis1").addEventListener("click", () => {
    copyHelper("analysisbody1");
});

document.getElementById("copyAnalysis2").addEventListener("click", () => {
    copyHelper("analysisbody2");
});

document.getElementById("copyAnalysis3").addEventListener("click", () => {
    copyHelper("analysisbody3");
});

function createNewTable() {
    const Tabulator = require("tabulator-tables");
    return new Tabulator("#logs-table", {
        autoResize: true,
        columns: [
            {title: "Date", field: "date", headerFilter: true},
            {title: "PID", field: "pid", headerFilter: true},
            {title: "Type", field: "type", headerFilter: true},
            {title: "Message", field: "message", headerFilter: true},
        ],
        groupBy: "pid",
        groupStartOpen: true,
        layoutColumnsOnNewData: true,
        rowDblClick: (e: MouseEvent, row: Tabulator.RowComponent) => {
            if (logLineExplanations.has(row.getData().id)) {
                alert(logLineExplanations.get(row.getData().id));
            }
        },
    });
}

function setDataToTable(data: ITabularCompatibleData[]) {
    logTable.setData(data).then(() => {
        logTable.redraw(true);
    });
}

function copyHelper(id: string) {
    const elementToCopy = document.getElementById(id);
    function listener(e: any) {
        e.clipboardData.setData("text/plain", elementToCopy.innerText);
        e.preventDefault();
    }

    document.addEventListener("copy", listener);
    document.execCommand("copy");
    document.removeEventListener("copy", listener);
}

function updateMetadataBox(process: Process) {
    const metadataBox = document.getElementById("analysisbody3");
    const hasWebClientSessions = process.webClientSessions.length > 0;
    const metadataArray = [`Process ID: ${process.pid}`,
                            `Duration: ${process.durationOfSession}`,
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

function scrollToRow() {
    if (scrollToRowNumber > -1) {
        logTable.scrollToRow(scrollToRowNumber, "top", true);
        scrollToRowNumber = -1;
    }
}

function showChart(logLines: ITabularCompatibleData[]) {
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
            onclick: (d, element) => { chartClickAction(d); },
            type: "scatter",
            xFormat: "%Y-%m-%d %H:%M:%S",
        },
    });

    document.getElementById("charting-area").style.position = "fixed";
    document.getElementById("charting-area").style.bottom = "3%";
    document.getElementById("charting-area").style.left = "3%";
    document.getElementById("charting-area").style.width = "94%";
}

function chartClickAction(data: any) {
    console.log("Chart:" + data.value);
    scrollToRowNumber = data.value;
    ($("#logtable") as any).tab("show");
}

function checkFileType(fileName: string): FileType {
    const fileNameArray = fileName.split(".");
    if (fileNameArray[fileNameArray.length - 1] === FileType.txt) {
        return FileType.txt;
    } else if (fileNameArray[fileNameArray.length - 1] === FileType.zip) {
        return FileType.zip;
    } else {
        return FileType.unknown;
    }
}

function processFilePath(filePath: string, concater: string): string[] {
    const filePathArray = filePath.split(concater);
    const fileName = filePathArray.pop();
    const dirPath = filePathArray.join(concater);
    return [dirPath, fileName];
}

document.ondragover = document.ondrop = (ev) => {
    ev.preventDefault();
};

document.body.ondrop = (ev) => {
    const filePath = ev.dataTransfer.files[0].path;
    const concater = process.platform === "darwin" ? "/" : "\\";
    const pathArray = processFilePath(filePath, concater);
    if (checkFileType(pathArray[1]) === FileType.txt) {
        ipcRenderer.send("fileLocation", filePath);
    } else if (checkFileType(pathArray[1]) === FileType.zip) {
        pathArray.push(filePath);
        ipcRenderer.send("zipFilePack", pathArray);
    }
    ev.preventDefault();
};
