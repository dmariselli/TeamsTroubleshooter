import { LogLine } from "./logLine";

export class Process {
    public pid: string;
    public pClientVersions: string[] = [];
    public logLines: LogLine[] = [];
    public adalVersion: string;
    private map = new Map();

    constructor(pid: string) {
        this.pid = pid;
    }

    public addWebClientVersion(value: string): boolean {
        if (!this.map.has(value)){
            this.map.set(value, true);    // set any value to Map
            this.pClientVersions.push(value);
            return true;
        }

        return false;
    }

    public getAllWebClientVersions(): string[] {
        return this.pClientVersions;
    }
}
