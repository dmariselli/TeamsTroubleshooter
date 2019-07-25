import { Analysis, AnalysisLevel, IProcessMetadata } from "./analysis/analyzer";
import { LogLine } from "./logLine";

export class Process {
    public pid: string;
    public logLines: LogLine[] = [];
    public adalVersion: string;
    public verboseAnalysisList: string[] = [];
    public warningAnalysisList: string[] = [];
    public failureAnalysisList: string[] = [];
    public appVersion: string = "N/A";
    public webClientSessions: string[] = [];
    public appLaunchReason: string = "N/A";
    private webClientSessionMap = new Map();

    constructor(pid: string) {
        this.pid = pid;
    }

    public addWebClientSession(value: string): boolean {
        if (!this.webClientSessionMap.has(value)) {
            this.webClientSessionMap.set(value, true);
            this.webClientSessions.push(value);
            return true;
        }

        return false;
    }

    public addAnalysis(analysisList: Analysis[]) {
        analysisList.forEach((analysis) => {
            if (analysis.level === AnalysisLevel.Verbose) {
                this.verboseAnalysisList.push(analysis.getExplanation());
            } else if (analysis.level === AnalysisLevel.Warning) {
                this.warningAnalysisList.push(analysis.getExplanation());
            } else if (analysis.level === AnalysisLevel.Failure) {
                this.failureAnalysisList.push(analysis.getExplanation());
            } else if (analysis.level === AnalysisLevel.Metadata) {
                this.processMetadataAnalysis(analysis);
            }
        });
    }

    public getMetadata(): IProcessMetadata {
        return { "App Version": this.appVersion, "App Launch Reason": this.appLaunchReason, "Web Client Sessions": this.webClientSessions };
    }

    private processMetadataAnalysis(analysis: Analysis) {
        for (const key in analysis.metadata) {
            const value: string = analysis.metadata[key];
            switch (key) {
                case "AppVersion":
                    this.appVersion = value;
                    break;
                case "AppLaunchReason":
                    this.appLaunchReason = value;
                    break;
                case "WebAppSession":
                    this.addWebClientSession(value);
                    break;
                default:
                    break;
            }
        }
    }
}
