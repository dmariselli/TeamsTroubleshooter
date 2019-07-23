import { Process } from "./process";

export class Processes {
    private processMap: Map<string, Process> = new Map<string, Process>();

    public getOrCreateProcess(pid: string): Process {
        if (this.processMap.has(pid)) {
            return this.processMap.get(pid);
        }

        let process = new Process(pid);
        this.processMap.set(pid, process);
        return process;
    }

    public getAllProcesses(): Process[] {
        return Array.from(this.processMap.values());
    }
}