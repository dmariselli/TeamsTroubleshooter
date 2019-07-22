import * as eventStream from "event-stream";
import * as fs from "fs";

export function start(file: string) {

    // tslint:disable-next-line: max-line-length
    const regex = /^(\w{3} \w{3} \d{2} \d{4} \d{2}:\d{2}:\d{2} GMT[+-]\d{4}) \([A-Za-z .]+\) <(\d+)> -- (\w+) -- (.+)/;
    let lineCount = 0;
    const logLines: LogLine[] = [];
    const errors: string[] = [];

    class LogLine {
        private logDate: string;
        private logPid: string;
        private logType: string;
        private logMessage: string;
        private logLineNumber: number;

        constructor(date: string, pid: string, type: string, message: string, lineNumber: number) {
            this.logDate = date;
            this.logPid = pid;
            this.logType = type;
            this.logMessage = message;
            this.logLineNumber = lineNumber;
        }

        public get date(): string {
            return this.logDate;
        }

        public get pid(): string {
            return this.logPid;
        }

        public get type(): string {
            return this.logType;
        }

        public get message(): string {
            return this.logMessage;
        }

        public appendToMessage(value: string): void {
            this.logMessage += value;
        }

        public get lineNumber(): number {
            return this.logLineNumber;
        }

        public toString(): string {
            return this.logLineNumber + this.logDate + this.logPid + this.logType + this.logMessage;
        }
    }

    // tslint:disable-next-line: no-console
    console.time("reading");

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
                    logLines.push(logLine);
                } catch (error) {
                    logLines.length > 0 ? logLines[logLines.length - 1] += line : errors.push(line);
                }
            })
            .on("error", (err) => {
                // tslint:disable-next-line: no-console
                console.error("Error while reading file.", err);
            })
            .on("end", () => {
                // tslint:disable-next-line: no-console
                console.timeEnd("reading");
                // tslint:disable-next-line: no-console
                console.log(lineCount);
                // tslint:disable-next-line: no-console
                console.log(logLines);
            }),
        );
}
