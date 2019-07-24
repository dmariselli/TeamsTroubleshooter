import { Analyzer} from "./analysis/analyzer";
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

    public getAllProcesses(): Process[] {
        return Array.from(this.processMap.values());
    }

    public getOrCreateFullProcess(logLine: LogLine): Process {
        const process = this.getOrCreateProcess(logLine.pid);
        const analysis = this.analyzer.analyze(logLine.message);
        process.logLines.push(logLine);
        if (analysis) {
            process.analysis.push(analysis);
        }

        return process;
    }
}
