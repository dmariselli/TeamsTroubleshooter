import * as moment from "moment";
import { Analysis, AnalysisLevel, IProcessMetadata } from "./analysis/analyzer";
import { LogLine } from "./logLine";

export class Process {
    public pid: string;
    public logLines: LogLine[] = [];
    public adalVersion: string;
    public verboseAnalysisList: string[][] = [];
    public warningAnalysisList: string[][] = [];
    public failureAnalysisList: string[][] = [];
    public verboseAnalysisFormatted: string;
    public warningAnalysisFormatted: string;
    public failureAnalysisFormatted: string;
    public appVersion: string = "N/A";
    public webClientSessions: string[] = [];
    public appLaunchReason: string = "N/A";
    public durationOfSession: string;
    private webClientSessionMap = new Map();
    private analysisList: Analysis[] = [];

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
            this.analysisList.push(analysis);
        });
    }

    public getMetadata(): IProcessMetadata {
        return { "App Version": this.appVersion, "App Launch Reason": this.appLaunchReason, "Web Client Sessions": this.webClientSessions };
    }

    public completeAnalysis(): void {
        const momentDiff = this.getSessionDuration(this.logLines);
        this.durationOfSession = `${Math.floor(momentDiff.asHours())}h ${momentDiff.minutes()}m ${momentDiff.seconds()}s`;

        this.analysisList.forEach((analysis) => {
            if (analysis.level === AnalysisLevel.Verbose) {
                this.verboseAnalysisList.push(analysis.explanation);
            } else if (analysis.level === AnalysisLevel.Warning) {
                const analysisExplanationList: string[] = [];
                analysis.explanation.forEach((item) => {
                    analysisExplanationList.push(`<li>${item}</li>`);
                });
                this.warningAnalysisFormatted = `<li>${analysis.title}:</li><ul>${analysisExplanationList.join("")}</ul>`;
                this.warningAnalysisList.push(analysis.explanation);
            } else if (analysis.level === AnalysisLevel.Failure) {
                const analysisExplanationList: string[] = [];
                analysis.explanation.forEach((item) => {
                    analysisExplanationList.push(`<li>${item}</li>`);
                });
                this.failureAnalysisFormatted = `<li>${analysis.title}:</li><ul>${analysisExplanationList.join("")}</ul>`;
                this.failureAnalysisList.push(analysis.explanation);
            } else if (analysis.level === AnalysisLevel.Metadata) {
                this.processMetadataAnalysis(analysis);
            }
        });

        if (!this.warningAnalysisFormatted) {
            this.warningAnalysisFormatted = "N/A";
        }
        if (!this.failureAnalysisFormatted) {
            this.failureAnalysisFormatted = "N/A";
        }
    }

    private getSessionDuration(logLines: LogLine[]): moment.Duration {
        let minDate: Date = new Date(8640000000000000);
        let maxDate: Date = new Date(-8640000000000000);

        logLines.forEach((logLine) => {
            minDate = minDate > logLine.dateTime ? logLine.dateTime : minDate;
            maxDate = maxDate < logLine.dateTime ? logLine.dateTime : maxDate;
        });

        const timeDiff = (maxDate as any) - (minDate as any);
        return moment.duration(timeDiff);
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
