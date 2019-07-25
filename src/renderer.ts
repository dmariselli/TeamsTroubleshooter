import * as c3 from "c3";
import * as d3 from "d3";
import { ipcRenderer } from "electron";
import { Process } from "./lib/process";

let logTableData:any;
let isFirstTime: boolean = true;
let processes: Process[];

ipcRenderer.on("data", (event: any, data: Array<{}>) => {
    logTableData = data;
    isFirstTime = true;
    showTable(data);
    showChart(data);
});

// For the drop down menu
ipcRenderer.on("processes", (event: any, data: Process[]) => {
    console.log(data.length);
    processes = data;
    var list = document.getElementById('dropdownmenu');
    processes.forEach((process: Process) => {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.setAttribute("id", process.pid);
        a.setAttribute("class", "pid");
        var text = document.createTextNode(process.pid);
        a.appendChild(text);
        a.href="#";
        li.appendChild(a);
        list.appendChild(li);

        document.getElementById(process.pid).addEventListener('click', function(){
            // Daniel San to Wax on ...Wax off
        });
    });
});

document.getElementById("logtable").addEventListener('click',function(){
    if(logTableData && isFirstTime) {
        console.log("Update table");
        setTimeout(() => 
            {
                showTable(logTableData);
                isFirstTime = false;
            },
            1000);
    }
});


ipcRenderer.on("debugData", (event: any, data: string[]) => {
    // tslint:disable-next-line: no-console
    if (data.length > 0) {
        data.forEach((logLine) => {
            console.log(logLine);
        });
    }
});

function showTable(logLines: Array<{}>) {
    const Tabulator = require("tabulator-tables");
    const table = new Tabulator("#logs-table", {
        autoResize: true,
        columns: [
            {title: "Date", field: "date"},
            {title: "PID", field: "pid"},
            {title: "Type", field: "type"},
            {title: "Message", field: "message"},
        ],
        groupBy: "pid",
        groupStartOpen: true,
    });

    table.setData(logLines);
}

function showChart(logLines: Array<{}>) {

    var nestedData = d3.nest().key(function(d:any) { return d.date; }).entries(logLines);
      var cities = d3.set();
      var formattedData = nestedData.map (function (entry) {
        var values = entry.values;
        var obj:any = {};
        values.forEach (function (value:any) {
          obj[value.type] = value.id;
          cities.add(value.type);
        })
        obj.date = entry.key;
        return obj;
      });

      var chart = c3.generate({
        bindto:"#charting-area",
        data: {
            json: formattedData,
            xFormat: '%Y-%m-%d %H:%M:%S',
            keys: {
                x: 'date', // it's possible to specify 'x' when category axis
                value: cities.values(),
            },
            type: 'scatter'
        },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    format: '%Y-%m-%d %H:%M:%S',
                    count: 10
                }
            }
        }
        
      });

      document.getElementById("charting-area").style.position = "fixed";
      document.getElementById("charting-area").style.bottom = "10px";
      document.getElementById("charting-area").style.left = "3%";
      document.getElementById("charting-area").style.width = "94%";
}

document.ondragover = document.ondrop = (ev) => {
    ev.preventDefault();
};

document.body.ondrop = (ev) => {
    ipcRenderer.send("fileLocation", ev.dataTransfer.files[0].path);
    ev.preventDefault();
};
