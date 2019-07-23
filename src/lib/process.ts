import { LogLine } from "./logLine";
import { Analysis } from "./analysis/analyzer";

export class Process {
    public pid: string;
    public logLines: LogLine[] = [];
    public adalVersion: string;
    public ssoEventDataMap: Map<string,string>[] = [];
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
