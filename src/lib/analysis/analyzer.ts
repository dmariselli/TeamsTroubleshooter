import { LocalStorageAnalyzer } from "./localStorageAnalyzer";
import { MetadataAnalyzer } from "./metadataAnalyzer";
import { SsoEventDataAnalyzer } from "./ssoEventDataAnalyzer";

export class Analyzer {
    private ssoEventDataAnalyzer: SsoEventDataAnalyzer;
    private localStorageAnalyzer: LocalStorageAnalyzer;
    private metadataAnalyzer: MetadataAnalyzer;

    constructor() {
        this.ssoEventDataAnalyzer = new SsoEventDataAnalyzer();
        this.localStorageAnalyzer = new LocalStorageAnalyzer();
        this.metadataAnalyzer = new MetadataAnalyzer();
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
            case AnalysisType.Metadata:
                return this.metadataAnalyzer.analyze(analyzableLog);
            default:
                break;
        }
    }

    private getAnalyzableLogIfApplicable(logType: string, message: string): AnalyzableLog {
        if (message.includes("ssoEventData")) {
            return new AnalyzableLog(AnalysisType.SsoEventData, message);
        } else if (logType === "error" && message.indexOf("storage.json") > -1) {
            return new AnalyzableLog(AnalysisType.LocalStorage, message);
        } else if (message.indexOf("Starting app Teams") > -1 || message.indexOf("Setting app session to") > -1) {
            return new AnalyzableLog(AnalysisType.Metadata, message);
        } else if (message.indexOf("User ring is") > -1) {
            return new AnalyzableLog(AnalysisType.Metadata, message);
        } else if (message.indexOf("Switching tenant:") > -1) {
            return new AnalyzableLog(AnalysisType.Metadata, message);
        }

        return new AnalyzableLog(AnalysisType.NotApplicable);
    }
}

export enum AnalysisType {
    NotApplicable = 0,
    SsoEventData = 1,
    LocalStorage = 2,
    Metadata = 3,
}

export enum AnalysisLevel {
    Verbose = 0,
    Warning = 1,
    Failure = 2,
    Metadata = 3,
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
    public title: string;
    public level: AnalysisLevel;
    public metadata: IMetadataMap;
    public explanation: string[] = [];

    constructor(level: AnalysisLevel, explanation?: string | IMetadataMap) {
        this.level = level;

        if (level === AnalysisLevel.Metadata) {
            this.metadata = explanation as IMetadataMap;
        } else if (explanation) {
            this.explanation.push(explanation as string);
        }
    }

    public appendExplanation(additionalExplanation: string) {
        if (!additionalExplanation) {
            return;
        }

        this.explanation.push(additionalExplanation);
    }

    public getExplanation(): string {
        return this.explanation.join("\n");
    }
}

export interface IMetadataMap {
    [key: string]: string;
}

export interface IProcessMetadata {
    [key: string]: string | string[];
}
