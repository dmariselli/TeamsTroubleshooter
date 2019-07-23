import * as eventStream from "event-stream";
import * as fs from "fs";
import { LogLine } from "./logLine";
import { Processes } from "./processes";
import * as Parser from "./parser";

export function start(file: string) {

    // tslint:disable-next-line: max-line-length
    const regex = /^(\w{3} \w{3} \d{2} \d{4} \d{2}:\d{2}:\d{2} GMT[+-]\d{4}) \([A-Za-z .]+\) <(\d+)> -- (\w+) -- (.+)/;
    let lineCount = 0;
    const allLogs: LogLine[] = [];
    const errors: string[] = [];
    let processes: Processes = new Processes();

    // tslint:disable-next-line: no-console
    console.time("Log Parsing");
    let count:string[];
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
                // tslint:disable-next-line: no-console
                console.timeEnd("Log Parsing");
                let processList = processes.getAllProcesses();
                // tslint:disable-next-line: no-console
                console.log(processList);
                processList.forEach((process) => {
                    if (process.analysis.length > 0) {
                        console.log(process.analysis[0].getExplanation());
                    }
                });
                console.log(count);
                // tslint:disable-next-line: no-console
                console.log(allLogs);
                if (errors.length > 0) {
                    // tslint:disable-next-line: no-console
                    console.error(errors);
                }
                tabulatorLogs(allLogs);
            }),
        );
}

function tabulatorLogs(logLines: LogLine[]) {
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
    logLines.forEach((logLine) => {
        data.push(logLine.tabulatorize());
    });

    table.setData(data);

    // tslint:disable-next-line: no-console
    console.log(table);
}
