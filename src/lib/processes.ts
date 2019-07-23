import { Process } from "./process";
import * as Analyzer from "./analysis/analyzer";
import { LogLine } from "./logLine";

export class Processes {
    private processMap: Map<string, Process> = new Map<string, Process>();
    private analyzer = new Analyzer.analyzer();

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

    public getOrCreateFullProcess(logLine: LogLine): Process {
        let process = this.getOrCreateProcess(logLine.pid);
        let analysis = this.analyzer.analyze(logLine.message);
        process.logLines.push(logLine);
        if (analysis) {
            process.analysis.push(analysis);
        }

        return process;
    }
}