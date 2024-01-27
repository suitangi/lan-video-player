// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron')
const path = require('node:path')
const express = require('express');
const {
  Signale
} = require('signale');

const logger = new Signale({
  logLevel: 'info'
});

//video control default options
const videoControlDefaults = {
  themeColor: [70, 70, 70], //rgb
  skipTiming: [1, 5, 10, 15, 30], //in seconds
  skipDefault: 10
}

//Setup Electron
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
});


let clientCount = 0;
let fullscreen = false;

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile('./video-player/index.html');
  mainWindow.setMenu(null);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  //Setup Express server for video controls
  const port = 8000;

  var expressApp = express();
  const http = require('http');
  const server = http.createServer(expressApp);
  const socket = require('socket.io')
  server.listen(port, () => {
    logger.debug(`Listening on *:${port}`);
  });
  const io = socket(server);


  expressApp.use(express.static('video-controls'));
  expressApp.use('/video', express.static('video-player'));

  //exposes other needed files from node modules
  expressApp.use('/material-symbols', express.static('node_modules/material-symbols'))
  expressApp.use('/socket.io-client', express.static('node_modules/socket.io-client/dist'))
  expressApp.use('/jquery', express.static('node_modules/jQuery/tmp'))


  io.sockets.on("connection", function(Socket) {
    logger.debug(`Socket: new connection ${Socket.id}`);
    clientCount++;
    Socket.on("ping", function(data) {
      logger.debug('socket: ping');
    });
    Socket.on("playpause", function(data) {
      logger.info('Socket: playpause');
      mainWindow.send('playpause');
    });
    Socket.on("fullscreen", function(data) {
      logger.info('Socket: fullscreen');
      if (fullscreen) {
        mainWindow.setFullScreen(false);
      } else {
        mainWindow.setFullScreen(true);
      }
      fullscreen = !fullscreen;
      mainWindow.send('request-update');
    });
    Socket.on("seeking", function(data) {
      mainWindow.send('seeking', data);
    });
    Socket.on("volume", function(data) {
      mainWindow.send('volume', data);
    });
    Socket.on("muted", function(data) {
      logger.info('Socket: muted')
      mainWindow.send('muted', data);
    });
    Socket.on("disconnect", function(data) {
      logger.debug(`Socket: disconnected ${Socket.id}`);
      clientCount--;
    });
    io.emit('initial-setup', videoControlDefaults);
  });



  //ipcMain handlers
  ipcMain.on('ping', (evt, arg) => {
    logger.debug('ipcMain: ping')
  });

  ipcMain.on('player-update', (evt, arg) => {
    data = arg;
    data['fullscreen'] = fullscreen;
    // logger.info(`Update got: ${JSON.stringify(data)}`)
    io.emit('update', data);
  });

}
