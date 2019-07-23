export class LogLine {
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
        return `${this.logLineNumber} ${this.logDate} ${this.logPid} ${this.logType} ${this.logMessage}`;
    }

    public clusterize(): string {
        // tslint:disable-next-line: max-line-length
        return `<tr><td>${this.logDate}</td> <td>${this.logPid}</td> <td>${this.logType}</td> <td>${this.logMessage}</td></tr>`;
    }

    public tabulatorize(): TabularCompatibleData {
        // tslint:disable-next-line: max-line-length
        return { id: this.logLineNumber, date: this.logDate, pid: this.logPid, type: this.logType, message: this.logMessage };
    }
}

export interface TabularCompatibleData {
    id: number;
    date: string;
    pid: string;
    type: string;
    message: string;
}