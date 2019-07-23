import { LogLine } from "./logLine";
import { stringify } from "querystring";

export class Process {
    private pPID: string;
    private pClientVersion: string;
    private pSsoEventData: Map<string,string>;
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

    public set ssoEventData(ssoEventDataList: string[]){
        for(let i:number=0;i<ssoEventDataList.length;i++) {
            let map:Map<string,string> = new Map<string,string>();
            let eventData = ssoEventDataList[i]
            let statusIndex = eventData.indexOf('::');
            map.set('status',eventData.substring(0,statusIndex));
            eventData = eventData.substring(statusIndex);

            let marks = eventData.split(';');

            marks.forEach((mark) =>{
                let markSplit = mark.split(':');
                map.set(markSplit[0],markSplit[1]);
            })
            this.pSsoEventData  = map;
        }
    }

    public get adalVersion(): string {
        return this.pAdalVersion;
    }

    public get firstLaunchTime(): string {
        return this.pFirstLaunch;
    }

}
