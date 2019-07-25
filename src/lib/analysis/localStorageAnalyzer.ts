import { Analysis, AnalysisLevel, AnalyzableLog } from "./analyzer";

export class LocalStorageAnalyzer {

    public analyze(localStorageLog: AnalyzableLog): Analysis[] {
        const analysis = this.transformLocalStorageEntry(localStorageLog.fullLogLine);
        analysis.title = "Local Storage";
        return [ analysis ];
    }

    public transformLocalStorageEntry(fullLogLine: string): Analysis {
        if (fullLogLine.indexOf("Error occurred while opening") > -1) {
            return new Analysis(AnalysisLevel.Failure, fullLogLine);
        } else if (fullLogLine.indexOf("File not found for storage.json. Ignore") > -1) {
            return new Analysis(AnalysisLevel.Failure, fullLogLine);
        } else if (fullLogLine.indexOf("while writting to ") > -1) {
            return new Analysis(AnalysisLevel.Failure, fullLogLine);
        }

        return;
    }
}
