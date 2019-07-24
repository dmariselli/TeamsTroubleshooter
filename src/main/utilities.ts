import { BrowserWindow } from "electron";

export function getWindowByName(name: string): Electron.BrowserWindow {
    try {
        for (const browserWindow of BrowserWindow.getAllWindows() as Electron.BrowserWindow[]) {
            if ((browserWindow as any).name === name) {
                return browserWindow;
            }
        }
    } catch (e) {
        return;
    }

    return null;
}

export function getWindow(): Electron.BrowserWindow {
    try {
        return getWindowByName("mainWindow");
    } catch (e) {
        return;
    }
}
