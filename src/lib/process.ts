import { LogLine } from "./logLine";

export class Process {
    public pid: string;
    public pClientVersions: string[] = [];
    public logLines: LogLine[] = [];
    public adalVersion: string;
    public ssoEventDataMap: Map<string,string>[] = [];
    private map = new Map();

    constructor(pid: string) {
        this.pid = pid;
    }

    public addWebClientVersion(value: string): boolean {
        if (!this.map.has(value)){
            this.map.set(value, true);
            this.pClientVersions.push(value);
            return true;
        }

        return false;
    }

    public getAllWebClientVersions(): string[] {
        return this.pClientVersions;
    }

    public addSsoEventData(eventData: string): void{

        let map:Map<string,string> = new Map<string,string>();
        let statusIndex = eventData.indexOf('::');
        map.set('status',eventData.substring(14,statusIndex));
        eventData = eventData.substring(statusIndex+1);

        let marks = eventData.split(';');
        marks.forEach((mark) => {
            let markSplit = mark.split(':');
            map.set(markSplit[0],markSplit[1]);
        });

        this.ssoEventDataMap.push(map);

    }
}
