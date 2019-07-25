import { ipcMain } from "electron";
import * as eventStream from "event-stream";
import * as fs from "fs";
import { ITabularCompatibleData, LogLine } from "./logLine";
import { Processes } from "./processes";
import * as Utilities from "./utilities";

class AppStart {
    constructor() {
        ipcMain.on("fileLocation", (event: any, data: string) => {
            this.start(data);
        });
    }

    public start(file: string) {

        const regex = /^(\w{3} \w{3} \d{2} \d{4} \d{2}:\d{2}:\d{2} GMT[+-]\d{4}) [^<]+ <(\d+)> -- (\w+) -- (.+)/;
        let lineCount = 0;
        const allLogs: LogLine[] = [];
        const errors: string[] = [];
        const processes: Processes = new Processes();

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
                        // console.error("Encountered the following error while parsing a log line: " + error);
                        // console.error("For log line: " + line);
                        allLogs.length > 0 ? allLogs[allLogs.length - 1].appendToMessage(line) : errors.push(line);
                    }
                })
                .on("error", (err) => {
                    console.error("Error while reading file.", err);
                })
                .on("end", () => {
                    console.timeEnd("Log Parsing");
                    console.log(`Total number of log lines processed: ${lineCount}.`);

                    if (errors.length > 0) {
                        console.error("Found the following errors.");
                        console.error(errors);
                    }

                    processes.completeAnalysis();
                    this.showDebuggingConsoleLogs(processes);

                    const tabularData: ITabularCompatibleData[] = [];
                    allLogs.forEach((logLine: LogLine) => {
                        tabularData.push(logLine.tabulatorize());
                    });

                    Utilities.getWindow().webContents.send("data", tabularData);
                    Utilities.getWindow().webContents.send("processes", processes.getAllProcesses());
                }),
            );
    }

    private showDebuggingConsoleLogs(processes: Processes) {
        const explanationList: string[] = [];
        const warningExplanationList: string[] = [];
        const failureExplanationList: string[] = [];
        const metadataList: string[] = [];
        const processList = processes.getAllProcesses();

        processList.forEach((process) => {
            process.verboseAnalysisList.forEach((analysis) => {
                explanationList.push(analysis.join("\n"));
            });

            if (process.warningAnalysisList.length > 0) {
                console.log("Warning PIDs:");
                process.warningAnalysisList.forEach((analysis) => {
                    console.log(process.pid);
                    warningExplanationList.push(analysis.join("\n"));
                });
            }

            if (process.failureAnalysisList.length > 0) {
                console.log("Failure PIDs:");
                process.failureAnalysisList.forEach((analysis) => {
                    console.log(process.pid);
                    failureExplanationList.push(analysis.join("\n"));
                });
            }

            metadataList.push(JSON.stringify(process.getMetadata()));
        });

        Utilities.getWindow().webContents.send("logToRenderer", "Verbose Analysis");
        Utilities.getWindow().webContents.send("debugData", explanationList);
        /*
        Utilities.getWindow().webContents.send("logToRenderer", "Warning Analysis");
        Utilities.getWindow().webContents.send("debugData", warningExplanationList);
        Utilities.getWindow().webContents.send("logToRenderer", "Failure Analysis");
        Utilities.getWindow().webContents.send("debugData", failureExplanationList);
        Utilities.getWindow().webContents.send("logToRenderer", "Metadata");
        Utilities.getWindow().webContents.send("debugData", metadataList);
        */
    }
}

let appStartInstance: AppStart;

export function getInstance() {
    if (!appStartInstance) {
        appStartInstance = new AppStart();
    }

    return appStartInstance;
}
