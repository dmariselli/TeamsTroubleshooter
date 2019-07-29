import c3 = require("c3");
import d3 = require("d3");
import { remote } from "electron";
import { ITabularCompatibleData } from "../lib/logLine";
import { Process } from "../lib/process";

export class AnalysisTabManager {

    constructor() {
        document.getElementById("copyAnalysis1").addEventListener("click", () => {
            this.copyHelper("analysisbody1");
        });

        document.getElementById("copyAnalysis2").addEventListener("click", () => {
            this.copyHelper("analysisbody2");
        });

        document.getElementById("copyAnalysis3").addEventListener("click", () => {
            this.copyHelper("analysisbody3");
        });
    }

    public updateMetadataBox(process: Process) {
        const metadataBox = document.getElementById("analysisbody3");
        const hasWebClientSessions = process.webClientSessions.length > 0;
        const metadataArray = [`Process ID: ${process.pid}`,
                                `Duration: ${process.durationOfSession}`,
                                `App Version: ${process.appVersion}`,
                                `App Launch Reason: ${process.appLaunchReason}`,
                                `User Ring Info: ${process.userInfoRings.length > 0 ? "" : "N/A"}`];
        const metadataList: string[] = [];
        metadataArray.forEach((element) => {
            metadataList.push(`<li>${element}</li>`);
        });
        if (process.userInfoRings.length > 0) {
            const userRingList: string[] = [];
            process.userInfoRings.forEach((element: string) => {
                userRingList.push(`<li>${element}</li>`);
            });
            metadataList.push(`<ul>${userRingList.join("")}</ul>`);
        }
        const metaDataObject = [`Web Client Sessions: ${hasWebClientSessions ? "" : "N/A"}`];
        metadataList.push(`<li>${metaDataObject}</li>`);

        if (hasWebClientSessions) {
            const webClientSessionsList: string[] = [];
            process.webClientSessions.forEach((element: string) => {
                webClientSessionsList.push(`<li>${element}</li>`);
            });

            metadataList.push(`<ul>${webClientSessionsList.join("")}</ul>`);
        }

        metadataBox.innerHTML = metadataList.join("");
    }

    public updateWarningBox(process: Process) {
        const warningBox = document.getElementById("analysisbody2");
        const warningList: string[] = [];
        const tenantSwitchOperationList: string[] = [];
        const tsOriginList = process.switchTenantOperations;
        const ringList = process.userInfoRings;

        for (let i = 0; i < tsOriginList.length; i++) {
            const preRing = process.userInfoRings[i];
            if (i + 1 < ringList.length) {
                const nextRing = ringList[i + 1];
                const metaDataObject = [`Switched tenant from ${preRing} to ${nextRing}.`];
                tenantSwitchOperationList.push(`<li>${metaDataObject}</li>`);
            }
        }

        if (tenantSwitchOperationList.length > 0) {
            const tenantSwitchObject = [`Tenant switch Info:`];
            warningList.push(`<li>${tenantSwitchObject}</li>`);
            warningList.push(`<ul>${tenantSwitchOperationList.join("")}</ul>`);
        }

        if (process.warningAnalysisFormatted !== "N/A") {
            warningList.push(process.warningAnalysisFormatted);
        }

        warningBox.innerHTML = warningList.join("");
    }

    public updateFailureBox(process: Process) {
        const failureBox = document.getElementById("analysisbody1");
        failureBox.innerHTML = process.failureAnalysisFormatted;
    }

    public showChart(logLines: ITabularCompatibleData[]) {
        const nestedData = d3.nest().key((d: any) => d.date).entries(logLines);
        const cities = d3.set();
        const formattedData = nestedData.map((entry) => {
                const values = entry.values;
                const obj: any = {};
                values.forEach ((value: any) => {
                    obj[value.type] = value.id;
                    cities.add(value.type);
                });
                obj.date = entry.key;
                return obj;
            });

        c3.generate({
            axis: {
                x: {
                    tick: {
                        count: 10,
                        format: "%Y-%m-%d %H:%M:%S",
                    },
                    type: "timeseries",
                },
            },
            bindto: "#charting-area",
            data: {
                json: formattedData,
                keys: {
                    value: cities.values(),
                    x: "date", // it's possible to specify 'x' when category axis
                },
                onclick: (d, element) => {
                    this.chartClickAction(d);
                },
                type: "scatter",
                xFormat: "%Y-%m-%d %H:%M:%S",
            },
        });

        document.getElementById("charting-area").style.position = "fixed";
        document.getElementById("charting-area").style.bottom = "3%";
        document.getElementById("charting-area").style.left = "3%";
        document.getElementById("charting-area").style.width = "94%";
    }

    private copyHelper(id: string) {
        const elementToCopy = document.getElementById(id);
        function listener(e: any) {
            e.clipboardData.setData("text/plain", elementToCopy.innerText);
            e.preventDefault();
        }

        document.addEventListener("copy", listener);
        document.execCommand("copy");
        document.removeEventListener("copy", listener);
    }

    private chartClickAction(data: any) {
        remote.getCurrentWindow().webContents.send("ScrollToRowNumber", data.value);
        remote.getCurrentWindow().webContents.send("UpdateIsFirstTime", true);
        ($("#logtable") as any).tab("show");
    }
}
