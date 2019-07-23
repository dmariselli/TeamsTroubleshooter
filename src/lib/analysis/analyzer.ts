import { ssoEventDataAnalyzer } from "./ssoEventDataAnalyzer";

export class analyzer {
    private failureLogCount: number = 0;
    private ssoEventDataAnalyzer: ssoEventDataAnalyzer;

    constructor() {
        this.ssoEventDataAnalyzer = new ssoEventDataAnalyzer();
    }

    public analyze(logMessage: string): Analysis {
        let analyzableLog = this.getAnalyzableLogIfApplicable(logMessage);
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

export class AnalyzableLog {
    public analysisType: AnalysisType;
    public fullLogLine: string;

    constructor(analysisType: AnalysisType, fullLogLine?: string) {
        this.analysisType = analysisType;
        this.fullLogLine = fullLogLine;
    }
}

export class Analysis {
    overallStatus: string;
    private pExplanation: string[] = [];

    appendExplanation(additionalExplanation: string) {
        if (!additionalExplanation) {
            return;
        }

        this.pExplanation.push(additionalExplanation);
    }

    getExplanation(): string {
        return this.pExplanation.join("\n");
    }
}
