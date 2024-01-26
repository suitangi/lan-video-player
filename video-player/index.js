//requires
const {
  ipcRenderer
} = require('electron')

const shell = require('electron').shell;



function sendStateUpdate(videoplayer) {
  let data = {
    'paused': videoplayer.paused(),
    'videoduration': videoplayer.duration(),
    'videoprogress': videoplayer.currentTime(),
    'volume': videoplayer.volume(),
    'muted': videoplayer.muted()
  };
  ipcRenderer.send('player-update', data);
}

$(document).ready(function() {

  const videoplayer = videojs.getPlayer('my-video');
  console.log('Video Player loaded');

  ipcRenderer.on('playpause', (event, arg) => {
    if (videoplayer.paused()) {
      videoplayer.play();
    } else {
      videoplayer.pause();
    }
    sendStateUpdate(videoplayer);
  });

  ipcRenderer.on('request-update', (event, arg) => {
    sendStateUpdate(videoplayer);
  });

  ipcRenderer.on('seeking', (event, arg) => {
    videoplayer.currentTime(arg);
  });

  ipcRenderer.on('volume', (event, arg) => {
    videoplayer.volume(arg);
  });

  ipcRenderer.on('muted', (event, arg) => {
    if (videoplayer.muted()) {
      videoplayer.muted(false);
    } else {
      videoplayer.muted(true);
    }
    sendStateUpdate(videoplayer);
  });

  window.updateInterval = setInterval(function(){ //updates every 100 milliseconds
    sendStateUpdate(videoplayer);
  }, 100)

  // ipcRenderer.on('fullscreen', (event, arg) => {
  //   if (videoplayer.isFullscreen_) {
  //     videoplayer.exitFullscreen();
  //   } else {
  //     videoplayer.requestFullscreen();
  //   }
  //   sendStateUpdate(videoplayer);
  // });
});
