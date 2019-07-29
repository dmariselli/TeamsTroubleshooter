import { Analysis, AnalysisLevel, Analyzer } from "./analysis/analyzer";
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
        let isAdded: boolean = false;

        if (analysisList) {
            analysisList.forEach((analysis) => {
                if (analysis.level === AnalysisLevel.Verbose) {
                    process.verboseAnalysisList.push(analysis.explanation);
                    logLine.analysis = analysis;
                } else if (analysis.level === AnalysisLevel.Warning) {
                    process.warningAnalysisFormatted = this.formatHelper(analysis.title, analysis.explanation);
                    process.warningAnalysisList.push(analysis.explanation);
                    if (!isAdded) {
                        process.addToFailureList(analysis.level);
                        isAdded = true;
                    }
                } else if (analysis.level === AnalysisLevel.Failure) {
                    process.failureAnalysisFormatted = this.formatHelper(analysis.title, analysis.explanation);
                    process.failureAnalysisList.push(analysis.explanation);
                    if (!isAdded) {
                        process.addToFailureList(analysis.level);
                        isAdded = true;
                    }
                } else if (analysis.level === AnalysisLevel.Metadata) {
                    process.processMetadataAnalysis(analysis);
                }
            });
        }

        process.logLines.push(logLine);
        return process;
    }

    public completeAnalysis(): void {
        this.getAllProcesses().forEach((process) => {
            process.completeAnalysis();
        });
    }

    private formatHelper(title: string, explanationList: string[]): string {
        const analysisExplanationList: string[] = [];
        explanationList.forEach((item) => {
            analysisExplanationList.push(`<li>${item}</li>`);
        });

        return `<li>${title}:</li><ul>${analysisExplanationList.join("")}</ul>`;
    }
}
