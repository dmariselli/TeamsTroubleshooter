import { SsoEventDataAnalyzer } from "./ssoEventDataAnalyzer";

export class Analyzer {
    private ssoEventDataAnalyzer: SsoEventDataAnalyzer;

    constructor() {
        this.ssoEventDataAnalyzer = new SsoEventDataAnalyzer();
    }

    public analyze(logMessage: string): Analysis {
        const analyzableLog = this.getAnalyzableLogIfApplicable(logMessage);
        if (!analyzableLog) {
            return;
        }

        switch (analyzableLog.analysisType) {
            case AnalysisType.SsoEventData:
                return this.ssoEventDataAnalyzer.analyze(analyzableLog);
            default:
                break;
        }
    }

    private getAnalyzableLogIfApplicable(message: string): AnalyzableLog {
        if (message.includes("ssoEventData")) {
            return new AnalyzableLog(AnalysisType.SsoEventData, message);
        }

        return new AnalyzableLog(AnalysisType.NotApplicable);
    }
}

export enum AnalysisType {
    NotApplicable = 0,
    SsoEventData = 1,
}

// tslint:disable-next-line: max-classes-per-file
export class AnalyzableLog {
    public analysisType: AnalysisType;
    public fullLogLine: string;

    constructor(analysisType: AnalysisType, fullLogLine?: string) {
        this.analysisType = analysisType;
        this.fullLogLine = fullLogLine;
    }
}

// tslint:disable-next-line: max-classes-per-file
export class Analysis {
    public overallStatus: string;
    private pExplanation: string[] = [];

    public appendExplanation(additionalExplanation: string) {
        if (!additionalExplanation) {
            return;
        }

        this.pExplanation.push(additionalExplanation);
    }

    public getExplanation(): string {
        return this.pExplanation.join("\n");
    }
}
