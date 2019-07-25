import { LocalStorageAnalyzer } from "./localStorageAnalyzer";
import { SsoEventDataAnalyzer } from "./ssoEventDataAnalyzer";

export class Analyzer {
    private ssoEventDataAnalyzer: SsoEventDataAnalyzer;
    private localStorageAnalyzer: LocalStorageAnalyzer;

    constructor() {
        this.ssoEventDataAnalyzer = new SsoEventDataAnalyzer();
        this.localStorageAnalyzer = new LocalStorageAnalyzer();
    }

    public analyze(logType: string, logMessage: string): Analysis[] {
        const analyzableLog = this.getAnalyzableLogIfApplicable(logType, logMessage);
        if (!analyzableLog) {
            return;
        }

        switch (analyzableLog.analysisType) {
            case AnalysisType.SsoEventData:
                return this.ssoEventDataAnalyzer.analyze(analyzableLog);
            case AnalysisType.LocalStorage:
                return this.localStorageAnalyzer.analyze(analyzableLog);
            default:
                break;
        }
    }

    private getAnalyzableLogIfApplicable(logType: string, message: string): AnalyzableLog {
        if (message.includes("ssoEventData")) {
            return new AnalyzableLog(AnalysisType.SsoEventData, message);
        } else if (logType === "error" && message.indexOf("storage.json") > -1) {
            return new AnalyzableLog(AnalysisType.LocalStorage, message);
        }

        return new AnalyzableLog(AnalysisType.NotApplicable);
    }
}

export enum AnalysisType {
    NotApplicable = 0,
    SsoEventData = 1,
    LocalStorage = 2,
}

export enum AnalysisLevel {
    Verbose = 0,
    Warning = 1,
    Failure = 2,
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
    public level: AnalysisLevel;
    private pExplanation: string[] = [];

    constructor(level: AnalysisLevel, explanation?: string) {
        this.level = level;
        if (explanation) {
            this.pExplanation.push(explanation);
        }
    }

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
