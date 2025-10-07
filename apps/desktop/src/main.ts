import { app, BrowserWindow } from 'electron';
import * as path from 'path';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      // You might want to enable nodeIntegration and contextIsolation
      // for specific use cases, but be aware of the security implications.
      // nodeIntegration: true,
      // contextIsolation: false,
    },
  });

  // Load the running Next.js development server.
  // In production, you would load the exported static files.
  mainWindow.loadURL('http://localhost:3000');

  // Open the DevTools automatically in development.
  // You can disable this for production builds.
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Quit when all windows are closed, except on macOS.
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
