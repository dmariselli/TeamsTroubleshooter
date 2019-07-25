import { Analysis, AnalyzableLog, AnalysisLevel } from "./analyzer";

export class SsoEventDataAnalyzer {
    private failureLogCount: number = 0;

    public analyze(ssoEventDataLog: AnalyzableLog): Analysis[] {
        this.failureLogCount = 0;
        let analysisList: Analysis[] = [];
        let verboseAnalysis: Analysis = new Analysis(AnalysisLevel.Verbose);
        let warningAnalysis: Analysis = new Analysis(AnalysisLevel.Warning);
        let failureAnalysis: Analysis = new Analysis(AnalysisLevel.Failure);
        let ssoEventData = ssoEventDataLog.fullLogLine;
        const statusIndex = ssoEventData.indexOf("::");

        if (statusIndex === -1) {
            return;
        }

        let status = ssoEventData.substring(14, statusIndex);
        ssoEventData = ssoEventData.substring(statusIndex + 2);
        let analysis: Analysis;

        const marks = ssoEventData.split(";");
        marks.forEach((mark: string) => {
            const colonIndex = mark.indexOf(":");
            if (colonIndex !== -1) {
                const action = mark.substring(0, colonIndex);
                const result = mark.substring(colonIndex + 1);
                analysis = this.transformSsoEventDataEntry(action, result);
            } else if (mark) {
                analysis = this.transformSsoEventDataEntry(mark);
            }

            verboseAnalysis.appendExplanation(analysis.getExplanation());
            switch (analysis.level) {
                case AnalysisLevel.Warning:
                    warningAnalysis.appendExplanation(analysis.getExplanation());
                    break;
                case AnalysisLevel.Failure:
                    failureAnalysis.appendExplanation(analysis.getExplanation());
                    break;
                default:
                    break;
            }
        });

        analysisList.push(verboseAnalysis);
        if (warningAnalysis.getExplanation()) {
            analysisList.push(warningAnalysis);
        }

        if (failureAnalysis.getExplanation()) {
            analysisList.push(failureAnalysis);
        }

        return analysisList;
    }

    public transformSsoEventDataEntry(action: string, result?: string): Analysis {
        const actionString = action.trim();
        let results: string[] = [];

        if (result) {
            results = result.split(":");
            result = result.trim();
        }

        switch (actionString) {
            case "acq":
                if (results.length === 1) {
                    return new Analysis(AnalysisLevel.Verbose, `The acquire token call completed with status ${result}.`);
                } else {
                    return new Analysis(AnalysisLevel.Verbose, `Attempting to acquire the ${result} resource token.`);
                }
            case "fp":
                return new Analysis(AnalysisLevel.Verbose, `The app will ${this.isSuccessful(result) ? "" : "not"} show a prompt as the default behavior.`);
            case "ctx":
                if (result === "c") {
                    return new Analysis(AnalysisLevel.Verbose, "No saved context found, creating a new auth context.");
                }

                return new Analysis(AnalysisLevel.Verbose, "Saved auth context from a previous session was found.");
            case "req_ui_known":
                return new Analysis(AnalysisLevel.Verbose, `The error code '${this.parseErrorCode(result)}' was emitted as part of the acquire token call. ` +
                        `As a result, we will attempt WIA if possible before showing a prompt.`);
            case "should_wia":
                return new Analysis(AnalysisLevel.Verbose, `WIA will ${this.isSuccessful(result) ? "" : "not"} be attempted as part of this auth flow.`);
            case "wia_status":
                return new Analysis(AnalysisLevel.Verbose, `WIA call returned status code ${this.parseErrorCode(result)}.`);
            case "wiaSkipDiffUser":
                if (result === "true") {
                    return new Analysis(AnalysisLevel.Verbose, "WIA was not attempted because the loginHint from the UPN does not match the domain joined user's UPN.");
                }

                return;
            case "no_upn":
                return new Analysis(AnalysisLevel.Verbose, "UPN is not present, so cannot attempt WIA. Will instead attempt to show a login prompt.");
            case "wiaSkipSetting":
                if (result === "true") {
                    return new Analysis(AnalysisLevel.Verbose, "WIA was not attempted because a flag was set to skip it.");
                }

                return;
            case "use_wia":
                if (result === "s") {
                    return new Analysis(AnalysisLevel.Verbose, "Modern WIA was attempted.");
                } else if (result === "f") {
                    return new Analysis(AnalysisLevel.Verbose, "WIA request failed to be made.");
                }

                return new Analysis(AnalysisLevel.Verbose, "No skip WIA hook was found. Proceeding with WIA attempt.");
            case "use_wa":
                if (result === "success") {
                    return new Analysis(AnalysisLevel.Verbose, "WIA was attempted.");
                }

                return new Analysis(AnalysisLevel.Verbose, "WIA request failed to be made.");
            case "wa_logoutskip":
                return new Analysis(AnalysisLevel.Verbose, "WIA attempt skipped since the user was logged out.");
            case "error_wia":
                return new Analysis(AnalysisLevel.Verbose, "WIA request failed to be made.");
            case "ats":
                return new Analysis(AnalysisLevel.Verbose, `Acquire token call resulted in status code '${this.parseErrorCode(results[0])}' and error code '${this.parseErrorCode(results[1])}'.`);
            case "at":
                return new Analysis(AnalysisLevel.Verbose, `The acquire token call failed and requested for user input. ` +
                        `As a result, a prompt may be shown unless there is already one running.`);
            case "fre-upn-win":
                return new Analysis(AnalysisLevel.Verbose, `${this.isSuccessful(result) ? "Succeeded" : "Failed"} in fetching the UPN from the UPN window.`);
            case "euV2":
                return new Analysis(AnalysisLevel.Verbose, "Extracting the user profile object from the fetched token.");
            case "ssoUserCookieSet":
                return new Analysis(AnalysisLevel.Verbose, `Attempted to set the user object cookie with result ${this.isSuccessful(result) ? "success" : result}.`);
            case "teamsSSOAuth":
                return new Analysis(AnalysisLevel.Verbose, `Attempted to set the token cookie with result ${this.isSuccessful(result) ? "success" : result}.`);
            case "ssoStatusCookieSet":
                return new Analysis(AnalysisLevel.Verbose, `Attempted to set the ssoStatus cookie with result ${this.isSuccessful(result) ? "success" : result}.`);
            case "aggCookie":
                return new Analysis(AnalysisLevel.Verbose, `Attempted to set the Chat Service Aggregator cookie with result ${this.isSuccessful(result) ? "success" : result}.`);
            case "removecookie":
                return new Analysis(AnalysisLevel.Verbose, "Failed to remove auth cookies.");
            case "removeCookieFlag":
                return new Analysis(AnalysisLevel.Verbose, "Attempting to remove the previous auth cookies (if any).");
            case "ubc":
                return new Analysis(AnalysisLevel.Verbose, "UPN was fetched before creating context by checking for homeUserUpn key in storage.json and if that failed, attempting to grab the Windows user UPN.");
            case "enc":
                return new Analysis(AnalysisLevel.Verbose, `${this.isSuccessful(result) ? "Succeeded" : "Failed"} in encoding the user object.`);
            case "addToMapV2":
                return new Analysis(AnalysisLevel.Verbose, `${this.isSuccessful(result) ? "Succeeded" : "Failed"} in adding/updating the user object to the async user map.`);
            case "detectSemicolon":
                return new Analysis(AnalysisLevel.Verbose, `${this.isSuccessful(result) ? "Found a" : "Did not find a"} semicolon in the user profile.`);
            case "addToMap":
                return new Analysis(AnalysisLevel.Verbose, `${this.isSuccessful(result) ? "Succeeded" : "Failed"} in adding the cached user to the user map for use by Offline/LBW flows. ` +
                        `This is old code that can cause issues for customers with special characters in their names.`);
            case "remav":
                return new Analysis(AnalysisLevel.Verbose, `ADAL 2 is disabled. ${this.isSuccessful(result) ? "Succeeded" : "Failed" } in trying to remove the adal version from the regkey (used by Outlook Add-in).`);
            case "sso_default_fail":
                if (results.length === 2) {
                    return new Analysis(AnalysisLevel.Verbose, `SSO failed with error code '${results[0]}' and status code '${results[1]}'.`);
                }

                this.failureLogCount = 2;
                return new Analysis(AnalysisLevel.Verbose, "Failed to SSO.");
            case "cacheUserCookie":
                if (result === "t") {
                    return new Analysis(AnalysisLevel.Verbose, "Successfully set the cached user profile cookie.");
                }

                return new Analysis(AnalysisLevel.Verbose, "Failed to set the cached user profile cookie. " +
                        "This is acceptable so long as the processEnv contains the cached user profile.");
            case "setCacheProfile":
                if (result === "t") {
                    return new Analysis(AnalysisLevel.Verbose, "Will attempt to set the cached user profile for Offline/LBW flow.");
                }

                return new Analysis(AnalysisLevel.Verbose, "The cached user profile is missing so cannot proceed with Offline/LBW flow.");
            case "setchatSvcAggCookie":
            case "setdesktopUserProfile":
            case "setssostatus":
            case "setSSOAUTHCOOKIE":
                if (result === "t") {
                    return new Analysis(AnalysisLevel.Verbose, `Set the ${actionString.substring(3)} cookie successfully.`);
                }

                return new Analysis(AnalysisLevel.Verbose, `Failed to set the ${actionString.substring(3)} cookie. ` +
                        `(Old code might return failure when it succeeds. Check following logs for real result.)`);
            case "frw=true":
            case "frw=false":
                return new Analysis(AnalysisLevel.Verbose, `Force reload web app is set to ${actionString.substring(4)}. This will affect Fast Tenant Switch scenarios only.`);
            case "rmvCookie":
                return new Analysis(AnalysisLevel.Verbose, "Code reached the remove cookie path.");
            case "resolve":
                return new Analysis(AnalysisLevel.Verbose, "Successfully removed all auth cookies.");
            case "reject":
                return new Analysis(AnalysisLevel.Verbose, "Failed to completely remove the cookies.");
            case "authAsync":
                return new Analysis(AnalysisLevel.Verbose, "Attempting to start the app in Offline/LBW flow.");
            case "authInit":
                return new Analysis(AnalysisLevel.Verbose, "Offline/LBW flow failed, so attempting to launch the app regularly.");
            case "setFailCookie":
                return new Analysis(AnalysisLevel.Verbose, "SSO failed, setting the failure ssoStatus cookie.");
            case "failCookieSet":
                return new Analysis(AnalysisLevel.Verbose, "Successfully set the failure ssoStatus cookie.");
            case "err=Error":
                return new Analysis(AnalysisLevel.Verbose, `The following error was thrown during the auth flow. '${result}'.`);
            case "lwp":
                return new Analysis(AnalysisLevel.Verbose, "Code is executing the login window promise.");
            case "lwp-status":
                if (result === "success") {
                    return new Analysis(AnalysisLevel.Verbose, "The prompt shown completed successfully.");
                }

                return new Analysis(AnalysisLevel.Verbose, `The auth prompt failed to fetch a token with error code '${this.parseErrorCode(result)}'.`);
            case "sso_catch":
                return new Analysis(AnalysisLevel.Verbose, "SSO failed.");
            case "mt-token-wiapre-token-acqmt-token-wia":
                if (result === "success") {
                    return new Analysis(AnalysisLevel.Verbose, "Silent token fetch succeeded.");
                }

                return new Analysis(AnalysisLevel.Verbose, `Silent token fetch of the MT token failed with error code '${this.parseErrorCode(result)}'.`);
            default:
                if (result) {
                    const indexOfSso = result.indexOf("sso-");
                    if (indexOfSso !== -1) {
                        return new Analysis(AnalysisLevel.Verbose, `${result.substring(indexOfSso, result.length - 1)} is complete.`);
                    }

                    if (this.failureLogCount === 2) {
                        this.failureLogCount--;
                        return new Analysis(AnalysisLevel.Verbose, `SSO failure error code ${actionString}.`);
                    } else if (this.failureLogCount === 1) {
                        this.failureLogCount--;
                        return new Analysis(AnalysisLevel.Verbose, `SSO failure status code ${actionString}.`);
                    }

                    return new Analysis(AnalysisLevel.Verbose, `Auth action taken: ${actionString} resulted in: ${result}.`);
                } else {
                    if (this.failureLogCount === 2) {
                        this.failureLogCount--;
                        return new Analysis(AnalysisLevel.Verbose, `SSO failure error code ${actionString}.`);
                    } else if (this.failureLogCount === 1) {
                        this.failureLogCount--;
                        return new Analysis(AnalysisLevel.Verbose, `SSO failure status code ${actionString}.`);
                    }

                    return new Analysis(AnalysisLevel.Verbose, `Auth action taken: ${actionString}.`);
                }
        }
    }

    private parseErrorCode(errorCode: string): string {
        switch (errorCode) {
            case "caa10001":
                return "CAA10001: Need user interface to continue";
            case "caa2000c":
            case "200":
                return `${errorCode.toUpperCase()}: The request requires user interaction`;
            case "caa20064":
                return "CAA20064: Server returned an unknown error code";
            case "caa20003":
                return "CAA20003: Invalid grant";
            case "4c7":
                return "4c7: The user cancelled the prompt";
            case "caa20001":
                return "CAA20001: The client is not authorized to request an authorization code using this method";
            case "0":
                return "0: Success";
            case "403":
                return "403: Forbidden";
            default:
                return errorCode;
        }
    }

    private isSuccessful(resultString: string): boolean {
        switch (resultString) {
            case "e=true":
            case "s":
            case "t":
            case "fre-upn-win-success":
                return true;
            case "f":
            case "false":
            case "n":
            default:
                return false;
        }
    }
}
