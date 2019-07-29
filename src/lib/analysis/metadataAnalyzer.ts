import { Analysis, AnalysisLevel, AnalyzableLog } from "./analyzer";

export class MetadataAnalyzer {
    private appVersionKey: string = "version";
    private appLaunchReasonKey: string = "reason";

    public analyze(metadataLog: AnalyzableLog): Analysis[] {
        const fullLogLine = metadataLog.fullLogLine;
        return [ this.transformMetadataEntry(fullLogLine) ];
    }

    public transformMetadataEntry(fullLogLine: string): Analysis {
        if (fullLogLine.indexOf("Starting app Teams") > -1) {
            const csv = fullLogLine.split(",");
            const appVersion = csv[1].substring(csv[1].indexOf(this.appVersionKey) + 8);
            const appLaunchReason = csv[2].substring(csv[2].indexOf(this.appLaunchReasonKey) + 7).trim();
            return new Analysis(AnalysisLevel.Metadata, { AppVersion: appVersion, AppLaunchReason: appLaunchReason });
        } else if (fullLogLine.indexOf("Setting app session to") > -1) {
            const webAppSession = fullLogLine.substring(fullLogLine.indexOf("Setting") + 23).trim();
            return new Analysis(AnalysisLevel.Metadata, { WebAppSession: webAppSession});
        } else if (fullLogLine.indexOf("User ring is") > -1) {
            const strList = fullLogLine.split(" ");
            const ringInfo = strList[strList.length - 2];
            return new Analysis(AnalysisLevel.Metadata, {UserRingInfo: ringInfo});
        } else if (fullLogLine.indexOf("Switching tenant") > -1) {
            const strList = fullLogLine.split(" ");
            const isHomeTenantVar = strList[4].split(":")[1];
            return new Analysis(AnalysisLevel.Metadata, { isHomeTenant: isHomeTenantVar});
        }

        return;
    }
}
