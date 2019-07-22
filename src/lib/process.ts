import { LogLine } from "./logLine";

export class Process {
    private pPID: string;
    private pClientVersion: string;
    private pLogLines: LogLine[];
    private pAdalVersion: string;
    private pFirstLaunch: string;

    constructor(pid: string, logLines: LogLine[], clientVersion: string) {
        this.pPID = pid;
        this.pLogLines = logLines;
        this.pClientVersion = clientVersion;
    }

    public get pid(): string {
        return this.pPID;
    }

    public get clientVersion(): string {
        return this.pClientVersion;
    }

    public get logLines(): LogLine[] {
        return this.pLogLines;
    }

    public get adalVersion(): string {
        return this.pAdalVersion;
    }

    public get firstLaunchTime(): string {
        return this.pFirstLaunch;
    }

}
