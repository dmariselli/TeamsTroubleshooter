import { Analysis } from "./analysis/analyzer";

export class LogLine {
    public dateTime: Date;
    public explanation: string;
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
        this.dateTime = new Date(date);
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

    public set analysis(analysis: Analysis) {
        this.explanation = analysis.getExplanation();
    }

    public toString(): string {
        return `${this.logLineNumber} ${this.logDate} ${this.logPid} ${this.logType} ${this.logMessage}`;
    }

    public tabulatorize(): ITabularCompatibleData {
        const formattedDate: string = `${this.dateTime.getFullYear()}-${this.dateTime.getMonth() + 1}-${this.dateTime.getDate()} ` +
                                        `${this.dateTime.getHours()}:${this.dateTime.getMinutes()}:${this.dateTime.getSeconds()}`;
        return { id: this.logLineNumber, date: formattedDate, pid: this.logPid, type: this.logType, message: this.logMessage };
    }
}

export interface ITabularCompatibleData {
    id: number;
    date?: string;
    pid?: string;
    type?: string;
    message?: string;
}
