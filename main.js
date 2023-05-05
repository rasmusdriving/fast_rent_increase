const path = require('path');
const { autoUpdater } = require("electron-updater");
const { app, BrowserWindow, globalShortcut, screen } = require('electron');
const { spawn } = require('child_process');

let fastAPIBackendProcess; // Declare the variable here

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  win.loadFile('index.html');
  return win;
}

function startFastAPIBackend() {
  const python = spawn('python3', ['app.py']);

  python.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  python.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  python.on('close', (code) => {
    console.log(`FastAPI backend exited with code ${code}`);
  });

  return python; // Return the child process
}

function checkForUpdates() {
  autoUpdater.checkForUpdatesAndNotify();

}

app.whenReady().then(() => {
  const win = createWindow();
  fastAPIBackendProcess = startFastAPIBackend(); // Assign the FastAPI server process to the global variable
  let isToggled = false;

  const bringToFrontAndCenter = () => {
    isToggled = !isToggled;

    if (isToggled) {
      const cursorPos = screen.getCursorScreenPoint();
      const currentDisplay = screen.getDisplayNearestPoint(cursorPos);
      const { width, height } = currentDisplay.workAreaSize;
      const { x, y } = currentDisplay.bounds;

      const xPos = x + Math.round((width - 800) / 2);
      const yPos = y + Math.round((height - 600) / 2);

      win.setPosition(xPos, yPos);
      win.setAlwaysOnTop(true);
      win.show();
    } else {
      win.setAlwaysOnTop(false);
      win.hide();
    }
  };

  globalShortcut.register('CommandOrControl+K', bringToFrontAndCenter);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      checkForUpdates();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Unregister the shortcut to avoid memory leaks
  globalShortcut.unregisterAll();
});

app.on('before-quit', () => {
  // Terminate the FastAPI server process by sending a SIGTERM signal
  fastAPIBackendProcess.kill('SIGTERM');
});
