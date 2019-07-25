import { Analysis, Analyzer } from "./analysis/analyzer";
import { LogLine } from "./logLine";
import { Process } from "./process";

export class Processes {
    private processMap: Map<string, Process> = new Map<string, Process>();
    private analyzer = new Analyzer();

    public getOrCreateProcess(pid: string): Process {
        if (this.processMap.has(pid)) {
            return this.processMap.get(pid);
        }

        const process = new Process(pid);
        this.processMap.set(pid, process);
        return process;
    }

    public getProcess(pid: string): Process {
        if (this.processMap.has(pid)) {
            return this.processMap.get(pid);
        }

        return;
    }

    public getAllProcesses(): Process[] {
        return Array.from(this.processMap.values());
    }

    public getOrCreateFullProcess(logLine: LogLine): Process {
        const process = this.getOrCreateProcess(logLine.pid);
        const analysisList: Analysis[] = this.analyzer.analyze(logLine.type, logLine.message);
        process.logLines.push(logLine);

        if (analysisList && analysisList.length > 0) {
            process.addAnalysis(analysisList);
        }

        return process;
    }
}
