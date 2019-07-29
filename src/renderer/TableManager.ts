import { ipcRenderer } from "electron";
import { ITabularCompatibleData } from "../lib/logLine";

export class TableManager {
    public scrollToRowNumber: number = -1;
    private logTable: any;
    private logLineExplanations: Map<number, string> = new Map<number, string>();

    constructor() {
        ipcRenderer.on("rowExtraData", (event: any, data: ITabularCompatibleData[]) => {
            data.forEach((explanation) => {
                this.logLineExplanations.set(explanation.id, explanation.message);
            });
        });

        ipcRenderer.on("ScrollToRowNumber", (event: any, data: number) => {
            this.scrollToRowNumber = data;
        });
    }

    public setUpTable(logLines: ITabularCompatibleData[]) {
        this.logTable = this.createNewTable(logLines);

        console.log("scroll: " + this.scrollToRowNumber);
        if (this.scrollToRowNumber > 0) {
            this.logTable.redraw(true);
            this.logTable.scrollToRow(this.scrollToRowNumber, "top", true);
        }
    }

    private createNewTable(logLines: ITabularCompatibleData[]) {
        const Tabulator = require("tabulator-tables");
        return new Tabulator("#logs-table", {
            autoResize: true,
            columns: [
                {title: "Date", field: "date", headerFilter: true},
                {title: "PID", field: "pid", headerFilter: true},
                {title: "Type", field: "type", headerFilter: true},
                {title: "Message", field: "message", headerFilter: true},
            ],
            data: logLines,
            groupBy: "pid",
            groupStartOpen: true,
            rowDblClick: (e: MouseEvent, row: Tabulator.RowComponent) => {
                if (this.logLineExplanations.has(row.getData().id)) {
                    alert(this.logLineExplanations.get(row.getData().id));
                }
            },
        });
    }
}
