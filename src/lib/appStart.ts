import * as eventStream from "event-stream";
import * as fs from "fs";
import { LogLine, TabularCompatibleData } from "./logLine";
import { Processes } from "./processes";
import * as Utilities from "./utilities";
import { ipcMain } from "electron";

class appStart {
    constructor() {
        ipcMain.on('fileLocation', (_event: any, data: string) => {
            this.start(data);
        })
    }

    public start(file: string) {

        // tslint:disable-next-line: max-line-length
        const regex = /^(\w{3} \w{3} \d{2} \d{4} \d{2}:\d{2}:\d{2} GMT[+-]\d{4}) \([A-Za-z .]+\) <(\d+)> -- (\w+) -- (.+)/;
        let lineCount = 0;
        const allLogs: LogLine[] = [];
        const errors: string[] = [];
        let processes: Processes = new Processes();
    
        // tslint:disable-next-line: no-console
        console.time("Log Parsing");
        fs.createReadStream(file)
            .pipe(eventStream.split())
            .pipe(
                eventStream.mapSync((line: any) => {
                    lineCount++;
                    try {
                        const result = regex.exec(line);
                        const logLine = new LogLine(
                            result[1],
                            result[2],
                            result[3],
                            result[4],
                            lineCount,
                        );
    
                        processes.getOrCreateFullProcess(logLine);
                        allLogs.push(logLine);
                    } catch (error) {
                        allLogs.length > 0 ? allLogs[allLogs.length - 1].appendToMessage(line) : errors.push(line);
                    }
                })
                .on("error", (err) => {
                    // tslint:disable-next-line: no-console
                    console.error("Error while reading file.", err);
                })
                .on("end", () => {
                    console.timeEnd("Log Parsing");
                    console.log(`Total number of log lines processed: ${lineCount}.`);
    
                    let processList = processes.getAllProcesses();
                    let explanationList: string[] = [];
                    processList.forEach((process) => {
                        if (process.analysis.length > 0) {
                            explanationList.push(process.analysis[0].getExplanation());
                        }
                    });

                    if (errors.length > 0) {
                        console.error(errors);
                    }

                    Utilities.getWindow().webContents.send('debugData', explanationList);
                    let tabularData: TabularCompatibleData[] = [];
                    allLogs.forEach((logLine: LogLine) => {
                        tabularData.push(logLine.tabulatorize());
                    });
    
                    Utilities.getWindow().webContents.send('data', tabularData);
                }),
            );
    }
}

let appStartInstance: appStart;

export function getInstance() {
    if (!appStartInstance) {
        appStartInstance = new appStart();
    }

    return appStartInstance;
}
