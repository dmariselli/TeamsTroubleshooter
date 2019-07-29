import { ipcRenderer } from "electron";
import { ITabularCompatibleData } from "./lib/logLine";
import { Process } from "./lib/process";
import { AnalysisTabManager } from "./renderer/AnalysisTabManager";
import { TableManager } from "./renderer/TableManager";

let logTableData: any;
let isFirstTime: boolean = true;
let processes: Process[];

const tableManager = new TableManager();
const analysisTabManager = new AnalysisTabManager();

enum FileType {
    txt = "txt",
    zip = "zip",
    unknown = "",
}

ipcRenderer.on("data", (event: any, data: ITabularCompatibleData[]) => {
    logTableData = data;
    isFirstTime = true;
    tableManager.setUpTable(data);
    analysisTabManager.showChart(data);
});

ipcRenderer.on("UpdateIsFirstTime", (event: any, data: boolean) => {
    isFirstTime = data;
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
            analysisTabManager.updateMetadataBox(relevantProcess);
            analysisTabManager.updateWarningBox(relevantProcess);
            analysisTabManager.updateFailureBox(relevantProcess);
        });
    });

    console.log("UL list" + list.childNodes.length);
    const mostRecentProcess = processes[processes.length - 1];
    analysisTabManager.updateMetadataBox(mostRecentProcess);
    analysisTabManager.updateWarningBox(mostRecentProcess);
    analysisTabManager.updateFailureBox(mostRecentProcess);
});

$(document).on("shown.bs.tab", 'a[href="#menu2"]', (e) => {
    tableManager.scrollToRowNumber = tableManager.scrollToRowNumber > 0 ? tableManager.scrollToRowNumber : 1;
    if (logTableData && isFirstTime) {
        tableManager.setUpTable(logTableData);
        isFirstTime = false;
        tableManager.scrollToRowNumber = -1;
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
