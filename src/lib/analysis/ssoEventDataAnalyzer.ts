import { Analysis, AnalyzableLog } from "./analyzer";

export class ssoEventDataAnalyzer {
    private failureLogCount: number = 0;

    public analyze(ssoEventDataLog: AnalyzableLog): Analysis {
        this.failureLogCount = 0;
        let analysis = new Analysis();
        let ssoEventData = ssoEventDataLog.fullLogLine;
        let statusIndex = ssoEventData.indexOf('::');
        
        if (statusIndex === -1) {
            return;
        }
    
        analysis.overallStatus = ssoEventData.substring(14, statusIndex);
        ssoEventData = ssoEventData.substring(statusIndex + 2);
    
        let marks = ssoEventData.split(';');
        marks.forEach((mark: string) => {
            let colonIndex = mark.indexOf(':');
            if (colonIndex !== -1) {
                let action = mark.substring(0, colonIndex);
                let result = mark.substring(colonIndex + 1);
                let actionTaken = this.transformSsoEventDataEntry(action, result);
                analysis.appendExplanation(actionTaken);
            } else if (mark) {
                let actionTaken = this.transformSsoEventDataEntry(mark);
                analysis.appendExplanation(actionTaken);
            }
        });
    
        return analysis;
    }

    public transformSsoEventDataEntry(action: string, result?: string): string {
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
            case "fp":
                return `The app will ${result === 'n' ? "not" : ""} show a prompt as the default behavior.`;
            case "ctx":
                if (result === "c") {
                    return "No saved context found, creating a new auth context.";
                }

                return "Saved auth context from a previous session was found.";
            case "req_ui_known":
                return `The error code '${this.parseErrorCode(result)}' was emitted as part of the acquire token call. As a result, we will attempt WIA if possible before showing a prompt.`;
            case "should_wia":
                return `WIA will ${result === "false" ? "not" : ""} be attempted as part of this auth flow.`;
            case "wia_status":
                return `WIA call returned status code ${result}.`;
            case "wiaSkipDiffUser":
                if (result === "true") {
                    return "WIA was not attempted because the loginHint from the UPN does not match the domain joined user's UPN.";
                }

                return "";
            case "no_upn":
                return "UPN is not present, so cannot attempt WIA. Will instead attempt to show a login prompt.";
            case "wiaSkipSetting":
                if (result === "true") {
                    return "WIA was not attempted because a flag was set to skip it.";
                }

                return "";
            case "use_wia":
                if (result === "s") {
                    return "WIA was attempted.";
                } else if (result === "f") {
                    return "WIA request failed to be made.";
                }

                return "WIA was attempted.";
            case "ats":
                return `Acquire token call resulted in status code '${results[0]}' and error code '${results[1]}'.`;
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
                    return `SSO failed with error code '${results[0]}' and status code '${results[1]}'.`;
                }
    
                this.failureLogCount = 2;
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
            case "lwp":
                return "Code is executing the login window promise.";
            case "lwp-status":
                if (result === "success") {
                    return "The prompt shown completed successfully."
                }

                return `The auth prompt failed to fetch a token with error code '${this.parseErrorCode(result)}'.`;
            case "sso_catch":
                return "SSO failed.";
            case "mt-token-wiapre-token-acqmt-token-wia":
                if (result === "success") {
                    return "Silent token fetch succeeded.";
                }

                return `Silent token fetch of the MT token failed with error code '${this.parseErrorCode(result)}'.`;
            default:
                if (result) {
                    let indexOfSso = result.indexOf("sso-");
                    if (indexOfSso !== -1) {
                        return `${result.substring(indexOfSso, result.length - 1)} is complete.`;
                    }
    
                    if (this.failureLogCount === 2) {
                        this.failureLogCount--;
                        return `SSO failure error code ${actionString}.`;
                    } else if (this.failureLogCount === 1) {
                        this.failureLogCount--;
                        return `SSO failure status code ${actionString}.`;
                    }
    
                    return `Action taken: ${actionString} resulted in: ${result}.`;
                } else {
                    if (this.failureLogCount === 2) {
                        this.failureLogCount--;
                        return `SSO failure error code ${actionString}.`;
                    } else if (this.failureLogCount === 1) {
                        this.failureLogCount--;
                        return `SSO failure status code ${actionString}.`;
                    }
    
                    return `Action taken: ${actionString}.`;
                }
        }
    }

    private parseErrorCode(errorCode: string): string {
        switch (errorCode) {
            case "caa10001":
                return "CAA10001: Need user interface to continue";
            case "caa2000c":
                return "CAA2000C: The request requires user interaction";
            case "caa20064":
                return "CAA20064: Server returned an unknown error code";
            case "caa20003":
                return "CAA20003: Invalid grant";
            case "4c7":
                return "4c7: The user cancelled the prompt";
            case "caa20001":
                return "CAA20001: The client is not authorized to request an authorization code using this method";
            default:
                return errorCode;
        }
    }
}
