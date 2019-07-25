import { Analysis, AnalysisLevel, AnalyzableLog } from "./analyzer";

export class SsoEventDataAnalyzer {
    private failureLogCount: number = 0;
    private adalVersion: string = "N/A";

    public analyze(ssoEventDataLog: AnalyzableLog): Analysis[] {
        this.failureLogCount = 0;
        this.adalVersion = "N/A";
        const analysisList: Analysis[] = [];
        let ssoEventData = ssoEventDataLog.fullLogLine;
        const statusIndex = ssoEventData.indexOf("::");

        if (statusIndex === -1) {
            return;
        }

        const title = ssoEventData.substring(14, statusIndex);
        ssoEventData = ssoEventData.substring(statusIndex + 2);
        const marks = ssoEventData.split(";");

        const verboseAnalysis: Analysis = new Analysis(AnalysisLevel.Verbose);
        const warningAnalysis: Analysis = new Analysis(AnalysisLevel.Warning);
        const failureAnalysis: Analysis = new Analysis(AnalysisLevel.Failure);
        let analysis: Analysis;

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

        verboseAnalysis.title = title;
        warningAnalysis.title = title;
        failureAnalysis.title = title;

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
        const isSuccess = this.isSuccessful(result);

        switch (actionString) {
            case "acq":
                if (results.length === 1) {
                    return new Analysis(AnalysisLevel.Verbose, `The acquire token call completed with status ${result}.`);
                } else {
                    return new Analysis(AnalysisLevel.Verbose, `Attempting to acquire the ${result} resource token.`);
                }
            case "fp":
                return new Analysis(isSuccess ? AnalysisLevel.Warning : AnalysisLevel.Verbose,
                    `The app will ${isSuccess ? "" : "not"} show a prompt as the default behavior.`);
            case "sfp":
                return new Analysis(AnalysisLevel.Verbose,
                    `There were ${isSuccess ? "" : "no"} entries in storage.json that require a force prompt to occur.`);
            case "gun":
                return new Analysis(AnalysisLevel.Warning,
                    "Failed to fetch the Windows user UPN. This is expected if the machine is not domain joined.");
            case "lhfw":
                return new Analysis(isSuccess ? AnalysisLevel.Verbose : AnalysisLevel.Warning,
                    `The UPN from the UPN window was ${isSuccess ? "" : "not"} found.`);
            case "iemDisabled":
                return new Analysis(AnalysisLevel.Verbose,
                    "IE Emulation mode is not enabled for this user.");
            case "iemEnabled":
                return new Analysis(AnalysisLevel.Warning,
                    "IE Emulation mode is enabled for this user.");
            case "wamEnabled":
                return new Analysis(AnalysisLevel.Warning,
                    "WAM is enabled for this user.");
            case "wamDisabled":
                return new Analysis(AnalysisLevel.Verbose,
                    "WAM is not enabled for this user.");
            case "adalv":
                if (result === "2") {
                    this.adalVersion = "2.2";
                } else if (result === "23") {
                    this.adalVersion = "2.3";
                } else {
                    this.adalVersion = result;
                }

                return new Analysis(AnalysisLevel.Warning,
                    `This auth flow is using ADAL ${this.adalVersion}`);
            case "upnOverride":
                return new Analysis(AnalysisLevel.Failure,
                    "UPN override flag is set. It will now attempt to get a back-up UPN given that the UPN from " +
                    "the UPN window is not present. This is for BVT testing scenarios ONLY.");
            case "winverchek":
            case "winvercheck":
                return new Analysis(AnalysisLevel.Verbose,
                    "Checking if the OS version is above Win 10 RS2. (This is to verify if os is WAM compatible.)");
            case "rmiergk":
                return new Analysis(AnalysisLevel.Warning,
                    "Removed the IE Emulation mode regkey due to a preauth setting.");
            case "wfd":
                return new Analysis(AnalysisLevel.Failure,
                    "UPN was missing from storage.json and also desktopConfig. " +
                    "But the fallback to get the domain joined username was disabled so will proceed without a UPN.");
            case "fallbackv2":
                return new Analysis(isSuccess ? AnalysisLevel.Warning : AnalysisLevel.Failure,
                    `UPN was missing from storage.json ${isSuccess ? "but" : "and" } was ${isSuccess ? "" : "not"} found in ` +
                    `desktopConfig.`);
            case "fallback":
                return new Analysis(isSuccess ? AnalysisLevel.Warning : AnalysisLevel.Failure,
                    `UPN was missing from storage.json. ${isSuccess ? "Succeeded" : "Failed"} in finding the ` +
                    `UPN from either storage.json entry of homeUserUpn or through the domain joined credentials. ` +
                    `This can result in an unnecessary prompts or unexpected behavior.`);
            case "ctx":
                if (result === "c") {
                    return new Analysis(AnalysisLevel.Verbose, "No saved context found, creating a new auth context.");
                }

                return new Analysis(AnalysisLevel.Verbose, "Saved auth context from a previous session was found.");
            case "req_ui_known":
                return new Analysis(AnalysisLevel.Verbose,
                    `The error code '${this.parseErrorCode(result)}' was emitted as part of the acquire token call. ` +
                        `As a result, we will attempt WIA if possible before showing a prompt.`);
            case "should_wia":
                return new Analysis(AnalysisLevel.Verbose,
                    `WIA will ${isSuccess ? "" : "not"} be attempted as part of this auth flow.`);
            case "wia_status":
                return new Analysis(AnalysisLevel.Verbose, `WIA call returned status code ${this.parseErrorCode(result)}.`);
            case "wiaSkipDiffUser":
                if (result === "true") {
                    return new Analysis(AnalysisLevel.Verbose,
                        "WIA was not attempted because the loginHint from the UPN does not match the domain joined user's UPN.");
                }

                return;
            case "no_upn":
                return new Analysis(AnalysisLevel.Verbose,
                    "UPN is not present, so cannot attempt WIA. Will instead attempt to show a login prompt.");
            case "wiaSkipSetting":
                if (result === "true") {
                    return new Analysis(AnalysisLevel.Verbose, "WIA was not attempted because a flag was set to skip it.");
                }

                return;
            case "use_wia":
                if (result === "s") {
                    return new Analysis(AnalysisLevel.Verbose, "Modern WIA was attempted.");
                } else if (result === "f") {
                    return new Analysis(AnalysisLevel.Warning, "WIA request failed to execute.");
                }

                return new Analysis(AnalysisLevel.Verbose, "No skip WIA hook was found. Proceeding with WIA attempt.");
            case "use_wa":
                if (result === "success") {
                    return new Analysis(AnalysisLevel.Verbose, "WIA was attempted.");
                }

                return new Analysis(AnalysisLevel.Warning, "WIA request failed to execute.");
            case "wa_logoutskip":
                return new Analysis(AnalysisLevel.Verbose, "WIA attempt skipped since the user was logged out.");
            case "error_wia":
                return new Analysis(AnalysisLevel.Verbose, "WIA request failed to execute.");
            case "ats":
                return new Analysis(AnalysisLevel.Verbose,
                    `Acquire token call resulted in status code '${this.parseErrorCode(results[0])}' ` +
                    `and error code '${this.parseErrorCode(results[1])}'.`);
            case "at":
                return new Analysis(AnalysisLevel.Warning,
                    `The acquire token call failed and requested for user input. ` +
                        `As a result, a prompt may be shown unless there is already one running.`);
            case "fre-upn-win":
                return new Analysis(AnalysisLevel.Verbose,
                    `${isSuccess ? "Succeeded" : "Failed"} in fetching the UPN from the UPN window.`);
            case "euV2":
                return new Analysis(AnalysisLevel.Verbose, "Extracting the user profile object from the fetched token.");
            case "ssoUserCookieSet":
                return new Analysis(isSuccess ? AnalysisLevel.Verbose : AnalysisLevel.Warning,
                    `Attempted to set the user object cookie with result ${isSuccess ? "success" : result}.`);
            case "teamsSSOAuth":
                return new Analysis(isSuccess ? AnalysisLevel.Verbose : AnalysisLevel.Warning,
                    `Attempted to set the token cookie with result ${isSuccess ? "success" : result}.`);
            case "ssoStatusCookieSet":
                return new Analysis(isSuccess ? AnalysisLevel.Verbose : AnalysisLevel.Warning,
                    `Attempted to set the ssoStatus cookie with result ${isSuccess ? "success" : result}.`);
            case "aggCookie":
                return new Analysis(isSuccess ? AnalysisLevel.Verbose : AnalysisLevel.Warning,
                    `Attempted to set the Chat Service Aggregator cookie with result ${isSuccess ? "success" : result}.`);
            case "removecookie":
                return new Analysis(AnalysisLevel.Verbose, "Failed to remove auth cookies.");
            case "removeCookieFlag":
                return new Analysis(AnalysisLevel.Verbose, "Attempting to remove the previous auth cookies (if any).");
            case "ubc":
                return new Analysis(AnalysisLevel.Verbose,
                    "UPN was fetched before creating context by checking for homeUserUpn key in storage.json and if that failed, " +
                    "attempting to grab the Windows user UPN.");
            case "enc":
                return new Analysis(AnalysisLevel.Verbose,
                    `${isSuccess ? "Succeeded" : "Failed"} in encoding the user object.`);
            case "addToMapV2":
                return new Analysis(AnalysisLevel.Verbose,
                    `${isSuccess ? "Succeeded" : "Failed"} in adding/updating the user object to the async user map.`);
            case "detectSemicolon":
                return new Analysis(isSuccess ? AnalysisLevel.Warning : AnalysisLevel.Verbose,
                    `${isSuccess ? "Found a" : "Did not find a"} semicolon in the user profile.`);
            case "addToMap":
                return new Analysis(AnalysisLevel.Verbose,
                    `${isSuccess ? "Succeeded" : "Failed"} in adding the cached user to the user map for use by ` +
                    `Offline/LBW flows. This is old code that can cause issues for customers with special characters in their names.`);
            case "remav":
                return new Analysis(isSuccess ? AnalysisLevel.Verbose : AnalysisLevel.Warning,
                    `ADAL 2 is disabled. ${isSuccess ? "Succeeded" : "Failed" } in trying to remove the ` +
                    `ADAL version from the regkey (used by Outlook Add-in).`);
            case "setav":
                return new Analysis(isSuccess ? AnalysisLevel.Verbose : AnalysisLevel.Warning,
                    `ADAL 2 is enabled. ${isSuccess ? "Succeeded" : "Failed" } in trying to add the ` +
                    `ADAL version regkey (used by Outlook Add-in).`);
            case "sso_default_fail":
                if (results.length === 2) {
                    return new Analysis(AnalysisLevel.Failure,
                        `SSO failed with error code '${results[0]}' and status code '${results[1]}'.`);
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
                return new Analysis(AnalysisLevel.Verbose,
                    `Force reload web app is set to ${actionString.substring(4)}. This will affect Fast Tenant Switch scenarios only.`);
            case "rmvCookie":
                return new Analysis(AnalysisLevel.Verbose, "Code reached the remove cookie path.");
            case "resolve":
                return new Analysis(AnalysisLevel.Verbose, "Successfully removed all auth cookies.");
            case "reject":
                return new Analysis(AnalysisLevel.Verbose, "Failed to completely remove the cookies.");
            case "authAsync":
                return new Analysis(AnalysisLevel.Warning, "Attempting to start the app in Offline/LBW flow.");
            case "authInit":
                return new Analysis(AnalysisLevel.Failure, "Offline/LBW flow failed, so attempting to launch the app regularly.");
            case "setFailCookie":
                return new Analysis(AnalysisLevel.Verbose, "SSO failed, setting the failure ssoStatus cookie.");
            case "failCookieSet":
                return new Analysis(AnalysisLevel.Verbose, "Successfully set the failure ssoStatus cookie.");
            case "err=Error":
                return new Analysis(AnalysisLevel.Failure, `The following error was thrown during the auth flow. '${result}'.`);
            case "lwp":
                return new Analysis(AnalysisLevel.Warning, "Code is executing the login window promise.");
            case "lwp-status":
                if (result === "success") {
                    return new Analysis(AnalysisLevel.Verbose, "The prompt shown completed successfully.");
                }

                return new Analysis(AnalysisLevel.Failure,
                    `The auth prompt failed to fetch a token with error code '${this.parseErrorCode(result)}'.`);
            case "sso_catch":
                return new Analysis(AnalysisLevel.Failure, "SSO failed.");
            case "mt-token-wiapre-token-acqmt-token-wia":
                if (result === "success") {
                    return new Analysis(AnalysisLevel.Verbose, "Silent token fetch succeeded.");
                }

                return new Analysis(AnalysisLevel.Verbose,
                    `Silent token fetch of the MT token failed with error code '${this.parseErrorCode(result)}'.`);
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
