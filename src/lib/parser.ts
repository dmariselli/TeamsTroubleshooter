export function analyze(logMessage: string): Analysis {
    let analyzableLog = getAnalyzableLogIfApplicable(logMessage);
    if (!analyzableLog) {
        return;
    }

    switch (analyzableLog.analysisType) {
        case AnalysisType.SsoEventData:
            return analyzeSsoEventData(analyzableLog);
        default:
            break;
    }
}

function getAnalyzableLogIfApplicable(message: string): AnalyzableLog {
    if (message.includes("ssoEventData")) {
        return new AnalyzableLog(AnalysisType.SsoEventData, message);
    }

    return new AnalyzableLog(AnalysisType.NotApplicable);
}

let failureLogCount: number = 0;

function analyzeSsoEventData(ssoEventDataLog: AnalyzableLog): Analysis {
    failureLogCount = 0;
    let analysis = new Analysis();
    let ssoEventData = ssoEventDataLog.fullLogLine;
    let statusIndex = ssoEventData.indexOf('::');
    
    if (statusIndex === -1) {
        return;
    }

    analysis.overallStatus = ssoEventData.substring(14, statusIndex);
    ssoEventData = ssoEventData.substring(statusIndex + 2);

    let marks = ssoEventData.split(';');
    marks.forEach((mark) => {
        let colonIndex = mark.indexOf(':');
        if (colonIndex !== -1) {
            let action = mark.substring(0, colonIndex);
            let result = mark.substring(colonIndex + 1);
            let actionTaken = transformSsoEventDataEntry(action, result);
            analysis.appendExplanation(actionTaken);
        } else if (mark) {
            let actionTaken = transformSsoEventDataEntry(mark);
            analysis.appendExplanation(actionTaken);
        }
    });

    return analysis;
}

function transformSsoEventDataEntry(action: string, result?: string): string {
    let actionString = action.trim();
    let results: string[] = [];

    if (result) {
        results = result.split(':');
        result = result.trim();
    }
    
    switch (actionString) {
        case "acq":
            if (results.length === 1) {
                return `The acquire token call completed with status ${result}.`
            } else {
                return `Attempting to acquire the ${result} resource token.`;
            }
        case "ats":
            return `Acquire token call resulted in status code ${results[0]} and error code ${results[1]}.`;
        case "at":
            return `The acquire token call failed and requested for user input. As a result, a prompt may be shown unless there is already one running.`;
        case "fre-upn-win":
            return `${result === "fre-upn-win-success" ? "Succeeded" : "Failed"} in fetching the UPN from the UPN window.`;
        case "euV2": 
            return "Extracting the user profile object from the fetched token.";
        case "ssoUserCookieSet":
            return `Attempted to set the user object cookie with result ${result === "e=true" ? "success" : result}.`;
        case "teamsSSOAuth":
            return `Attempted to set the token cookie with result ${result === "e=true" ? "success" : result}.`;
        case "ssoStatusCookieSet":
            return `Attempted to set the ssoStatus cookie with result ${result === "e=true" ? "success" : result}.`;
        case "aggCookie":
            return `Attempted to set the Chat Service Aggregator cookie with result ${result === "e=true" ? "success" : result}.`;
        case "removecookie":
            return "Failed to remove auth cookies.";
        case "removeCookieFlag":
            return "Attempting to remove the previous auth cookies (if any).";
        case "enc":
            return `${result === 't' ? "Succeeded" : "Failed"} in encoding the user object.`;
        case "addToMapV2":
            return `${result === 't' ? "Succeeded" : "Failed"} in adding/updating the user object to the async user map.`;
        case "detectSemicolon":
            return `${result === 's' ? "Found a" : "Did not find a"} semicolon in the user profile.`;
        case "sso_default_fail":
            if (results.length === 2) {
                return `SSO failed with error code ${results[0]} and status code ${results[1]}.`;
            }

            failureLogCount = 2;
            return "Failed to SSO.";
        case "cacheUserCookie":
            if (result === "t") {
                return "Successfully set the cached user profile cookie.";
            }

            return "Failed to set the cached user profile cookie. This is acceptable so long as the processEnv contains the cached user profile.";
        case "setCacheProfile":
            if (result === "t") {
                return "Will attempt to set the cached user profile for Offline/LBW flow.";
            }

            return "The cached user profile is missing so cannot proceed with Offline/LBW flow.";
        case "setchatSvcAggCookie":
        case "setdesktopUserProfile":
        case "setssostatus":
        case "setSSOAUTHCOOKIE":
            if (result === "t") {
                return `Set the ${actionString.substring(3)} cookie successfully.`;
            }

            return `Failed to set the ${actionString.substring(3)} cookie. (Old code might return failure when it succeeds. Check following logs for real result.)`;
        case "frw=true":
        case "frw=false":
            return `Force reload web app is set to ${actionString.substring(4)}. This will affect Fast Tenant Switch scenarios only.`;
        case "rmvCookie":
            return "Code reached the remove cookie path.";
        case "resolve":
            return "Successfully removed all auth cookies.";
        case "reject":
            return "Failed to completely remove the cookies.";
        case "authAsync":
            return "Attempting to start the app in Offline/LBW flow.";
        case "authInit":
            return "Offline/LBW flow failed, so attempting to launch the app regularly.";
        case "setFailCookie":
            return "SSO failed, setting the failure ssoStatus cookie.";
        case "failCookieSet":
            return "Successfully set the failure ssoStatus cookie.";
        default:
            if (result) {
                let indexOfSso = result.indexOf("sso-");
                if (indexOfSso !== -1) {
                    return `${result.substring(indexOfSso, result.length - 1)} is complete.`;
                }

                if (failureLogCount === 2) {
                    failureLogCount--;
                    return `SSO failure error code ${actionString}.`;
                } else if (failureLogCount === 1) {
                    failureLogCount--;
                    return `SSO failure status code ${actionString}.`;
                }

                return `Action taken: ${actionString} resulted in: ${result}.`;
            } else {
                if (failureLogCount === 2) {
                    failureLogCount--;
                    return `SSO failure error code ${actionString}.`;
                } else if (failureLogCount === 1) {
                    failureLogCount--;
                    return `SSO failure status code ${actionString}.`;
                }

                return `Action taken: ${actionString}.`;
            }
    }
}

class AnalyzableLog {
    public analysisType: AnalysisType;
    public fullLogLine: string;

    constructor(analysisType: AnalysisType, fullLogLine?: string) {
        this.analysisType = analysisType;
        this.fullLogLine = fullLogLine;
    }
}

enum AnalysisType {
    NotApplicable = 0,
    SsoEventData = 1,
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