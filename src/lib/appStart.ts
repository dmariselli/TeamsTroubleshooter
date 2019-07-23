import * as Clusterize from "clusterize.js";
import * as eventStream from "event-stream";
import * as fs from "fs";
import { LogLine } from "./logLine";
import { Process } from "./process";

export function start(file: string) {

    // tslint:disable-next-line: max-line-length
    const regex = /^(\w{3} \w{3} \d{2} \d{4} \d{2}:\d{2}:\d{2} GMT[+-]\d{4}) \([A-Za-z .]+\) <(\d+)> -- (\w+) -- (.+)/;
    let lineCount = 0;
    let logLines: LogLine[] = [];
    const allLogs: LogLine[] = [];
    const errors: string[] = [];
    let map:Map<string, Process> = new Map<string, Process>();

    // tslint:disable-next-line: no-console
    console.time("Log Parsing");
    let currentPid:string = undefined;
    let currentClientVersion: string = undefined;
    let currentSsoEventData: string[] = [];
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
                    if(!currentPid) { currentPid = result[2];}
                    else if(currentPid != result[2]) {
                        let process: Process = new Process(currentPid,logLines, currentClientVersion);
                        process.ssoEventData = currentSsoEventData;
                        map.set(currentPid, process);
                        logLines = [];
                        currentPid = result[2];
                        currentClientVersion = undefined;
                        currentSsoEventData = [];
                    } else if(!currentClientVersion) {
                        let index = result[4].indexOf("Client version is:");
                        if(index > -1) currentClientVersion = result[4].substring(index+19);
                    }

                    if(result[3] === 'event' && result[4].indexOf('ssoEventData') > -1){
                        currentSsoEventData.push(result[4]);
                    }
                    logLines.push(logLine);
                    allLogs.push(logLine);
                } catch (error) {
                    logLines.length > 0 ? logLines[logLines.length - 1].appendToMessage(line) : errors.push(line);
                }
            })
            .on("error", (err) => {
                // tslint:disable-next-line: no-console
                console.error("Error while reading file.", err);
            })
            .on("end", () => {
                // tslint:disable-next-line: no-console
                console.timeEnd("Log Parsing");
                // tslint:disable-next-line: no-console
                let process: Process = new Process(currentPid,logLines, currentClientVersion);
                process.ssoEventData = currentSsoEventData;
                map.set(currentPid, process);
                console.log(map);
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
        height: "2000px",
    });

    const data: any = [];
    logLines.forEach((logLine) => {
        data.push(logLine.tabulatorize());
    });

    table.setData(data);

    // tslint:disable-next-line: no-console
    console.log(table);
}
