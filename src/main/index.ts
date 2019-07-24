import { app, BrowserWindow, dialog, Menu, shell } from "electron";
import * as path from "path";
import * as AppStart from "./appStart";

let mainWindow: Electron.BrowserWindow;

const template = [{
  label: "View",
  submenu: [{
    accelerator: "CmdOrCtrl+R",
    click: (item: any, focusedWindow: { id: number; reload: () => void; }) => {
      if (focusedWindow) {
        // on reload, start fresh and close any old
        // open secondary windows
        if (focusedWindow.id === 1) {
          BrowserWindow.getAllWindows().forEach((win) => {
            if (win.id > 1) {
              win.close();
            }
          });
        }
        focusedWindow.reload();
      }
    },
    label: "Reload",
  },
  {
    accelerator: (() => {
      if (process.platform === "darwin") {
        return "Ctrl+Command+F";
      } else {
        return "F11";
      }
    })(),
    click: (item: any, focusedWindow: { setFullScreen: (arg0: boolean) => void; isFullScreen: () => boolean; }) => {
      if (focusedWindow) {
        focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
      }
    },
    label: "Toggle Full Screen",
  }, {
    accelerator: (() => {
      if (process.platform === "darwin") {
        return "Alt+Command+I";
      } else {
        return "Ctrl+Shift+I";
      }
    })(),
    click: (item: any, focusedWindow: { toggleDevTools: () => void; }) => {
      if (focusedWindow) {
        focusedWindow.toggleDevTools();
      }
    },
    label: "Toggle Developer Tools",
  }, {
    type: "separator",
  }, {
    click: (item: any, focusedWindow: any) => {
      if (focusedWindow) {
        const options = {
          buttons: ["Ok"],
          message: "App version 0.0.2",
          title: "App Version",
          type: "info",
        };
        dialog.showMessageBox(focusedWindow, options);
      }
    },
    label: "App Version",
  }],
},
{
  label: "Manage Files",
  submenu: [{
    accelerator: "CmdOrCtrl+O",
    click: () => {
      dialog.showOpenDialog({ properties: ["openFile"] }, (filePaths) => {
        if (filePaths && filePaths.length > 0) {
          AppStart.getInstance().start(filePaths[0]);
        }
      });
    },
    label: "Open",
    }],
  },
{
  label: "Window",
  role: "window",
  submenu: [{
    accelerator: "CmdOrCtrl+M",
    label: "Minimize",
    role: "minimize",
  }, {
    accelerator: "CmdOrCtrl+W",
    label: "Close",
    role: "close",
  }, {
    type: "separator",
  }, {
    accelerator: "CmdOrCtrl+Shift+T",
    click: () => {
      app.emit("activate");
    },
    enabled: false,
    key: "reopenMenuItem",
    label: "Reopen Window",
  }],
}, {
  label: "Help",
  role: "help",
  submenu: [{
    click: () => {
      shell.openExternal("https://teams.microsoft.com");
    },
    label: "Open Teams",
  }],
}] as Electron.MenuItemConstructorOptions[];


function createWindow() {
  AppStart.getInstance();
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 1200,
    width: 1800,
  });

  (mainWindow as any).name = "mainWindow";

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "../index.html"));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    (mainWindow as any) = null;
  });
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it"s common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
