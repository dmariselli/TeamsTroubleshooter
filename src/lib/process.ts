import { Analysis } from "./analysis/analyzer";
import { LogLine } from "./logLine";

export class Process {
    public pid: string;
    public logLines: LogLine[] = [];
    public adalVersion: string;
    public analysis: Analysis[] = [];
    private pClientVersions: string[] = [];
    private webClientMap = new Map();

    constructor(pid: string) {
        this.pid = pid;
    }

    public addWebClientVersion(value: string): boolean {
        if (!this.webClientMap.has(value)){
            this.webClientMap.set(value, true);
            this.pClientVersions.push(value);
            return true;
        }

        return false;
    }

    public getAllWebClientVersions(): string[] {
        return this.pClientVersions;
    }
}
