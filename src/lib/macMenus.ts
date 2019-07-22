import { Menu, MenuItem, app } from "electron";

export function initialize() {
    if (process.platform === 'darwin') return;
  
    setMenu();
    setupDockMenu();
  }
  
  function setupDockMenu() {
    let menu = new Menu();
    app.dock.setMenu(menu);
  }
  
  function setMenu() {
    let menu = Menu.buildFromTemplate([
      {
        label: 'Teams Troubleshooter',
        submenu: [
          {
            label: 'About',
            click: () => {
              
            }
          },
          {
            type: 'separator'
          },
          {
            label: 'services',
            role: 'services',
            submenu: []
          },
          {
            type: 'separator'
          },
          {
            label: 'Hide',
            role: 'hide'
          },
          {
            label: 'Hide Others',
            role: 'hideothers'
          },
          {
            label: 'Unhide',
            role: 'unhide'
          },
          {
            type: 'separator'
          },
          {
            label: 'App Menu Quit',
            accelerator: 'Cmd+Q',
            click: () => {
            }
          }
        ]
      },
      {
        label: 'Toggle Fullscreen',
        role: 'togglefullscreen'
      },
      {
        label: 'Window',
        role: 'window',
        submenu: [
          {
            label: 'Close',
            role: 'close'
          },
          {
            label: 'Minimize',
            role: 'minimize'
          },
          {
            label: 'Zoom',
            role: 'zoom'
          },
          {
            type: 'separator'
          },
          {
            label: 'Front',
            role: 'front'
          }
        ]
      },
    ]);
  
    menu.append(buildDebugMenu());
    Menu.setApplicationMenu(menu);
  }
  
  function buildDebugMenu() {
    let submenu = new Menu();
    submenu.insert(0, new MenuItem({
      label: 'Reload',
      accelerator: 'CmdOrCtrl+R',
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          focusedWindow.webContents.reloadIgnoringCache();
        }
      }
    }));
    submenu.insert(1, new MenuItem({
      label: 'Toggle DevTools',
      accelerator: 'Alt+CmdOrCtrl+I',
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          focusedWindow.webContents.toggleDevTools();
        }
      }
    }));
    let debugMenu = new MenuItem({
      label: 'Development',
      submenu: submenu
    });
    return debugMenu;
  }
  