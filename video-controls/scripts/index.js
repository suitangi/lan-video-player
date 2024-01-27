function setThemeColor(color) {
  if (color.length != 3 || typeof color[0] !== 'number' || typeof color[1] !== 'number' || typeof color[2] !== 'number') {
    throw new Error('Color should be an array with 3 values (rgb)')
  }
  var r = document.querySelector(':root');
  r.style.setProperty('--colorPrimary-h', color[0]);
  r.style.setProperty('--colorPrimary-s', color[1]);
  r.style.setProperty('--colorPrimary-l', color[2]);
}

function setPlayRate(arr, initial, socket) {
  document.getElementById('playRateList').innerHTML = '';
  document.getElementById('playRateButton').innerText = `${initial}⨯`;
  window.playRate = initial;
  let liNode, aNode;
  let list = document.getElementById('playRateList');
  arr.forEach((pr) => {
    let liNode = document.createElement('li');
    let aNode = document.createElement('a');
    aNode.setAttribute('href', '#');
    aNode.innerText = `${pr}⨯`;
    liNode.appendChild(aNode);
    liNode.setAttribute('data-playrate', pr);
    liNode.addEventListener('click', function(e) {
      let pr = parseFloat(this.getAttribute('data-playrate'));
      window.playRate = pr;
      socket.emit('playrate', pr)
      document.getElementById('playRateButton').innerText = `${pr}⨯`;
      document.getElementById('playRateDropdown').removeAttribute('open');
    });
    list.appendChild(liNode);
  });
}

function setSkipTiming(arr, initial) {
  document.getElementById('timingList').innerHTML = '';
  document.getElementById('timingButton').innerText = `${initial}s`;
  window.skipTiming = initial;
  let liNode, aNode;
  let list = document.getElementById('timingList');
  arr.forEach((timing) => {
    let liNode = document.createElement('li');
    let aNode = document.createElement('a');
    aNode.setAttribute('href', '#');
    aNode.innerText = `${timing}s`;
    liNode.appendChild(aNode);
    liNode.setAttribute('data-timing', timing);
    liNode.addEventListener('click', function(e) {
      window.skipTiming = parseFloat(this.getAttribute('data-timing'));
      document.getElementById('timingButton').innerText = `${this.getAttribute('data-timing')}s`;
      document.getElementById('timingDropdown').removeAttribute('open');
    });
    list.appendChild(liNode);
  });
}

function setProgressTexts(seconds, duration) {
  let min = Math.floor(seconds / 60);
  let sec = Math.floor(seconds - (min * 60));
  if (min < 10)
    min = `0${min}`;
  if (sec < 10)
    sec = `0${sec}`;
  document.getElementById('progressTime').innerText = `${min}:${sec}`;

  let secLeft = duration - seconds;
  min = Math.floor(secLeft / 60);
  sec = Math.floor(secLeft - (min * 60));
  if (min < 10)
    min = `0${min}`;
  if (sec < 10)
    sec = `0${sec}`;
  document.getElementById('progressDuration').innerText = `${min}:${sec}`;
}

function setVideoProgress(seconds, duration) {
  if (window.lastVideoProgress == seconds)
    return;

  document.getElementById('progressRange').value = seconds;
  setProgressTexts(seconds, duration);

  //set the range
  if (duration != window.lastVideoDuration) {
    document.getElementById('progressRange').min = 0;
    document.getElementById('progressRange').max = duration;
  }
  window.lastVideoProgress = seconds;
  window.lastVideoDuration = duration;
}

function setVolume(volume, muted) {
  if (window.lastVolume == volume && window.lastMuted == muted)
    return;

  document.getElementById('volumeRange').value = volume;
  let percent = Math.floor(volume * 100);
  document.getElementById('volumePercentage').innerText = `${percent}%`;

  if (muted)
    document.getElementById('volumeButtonText').innerText = 'volume_off';
  else if (volume < .33)
    document.getElementById('volumeButtonText').innerText = 'volume_mute';
  else if (volume < 0.67)
    document.getElementById('volumeButtonText').innerText = 'volume_down';
  else
    document.getElementById('volumeButtonText').innerText = 'volume_up';

  window.lastVolume = volume;
  window.lastMuted = muted;
}

const emptyData = {};

$(document).ready(function() {

  let socket = io.connect(location.host);

  window.lastVideoProgress = 0;
  window.lastVideoDuration = 0;
  window.lastVolume = 0;
  window.skipTiming;
  window.playRate;

  document.getElementById('playButton').addEventListener('click', function(e) {
    console.log('Play/Pause Button');
    socket.emit("playpause", emptyData);
  });
  document.getElementById('fsButton').addEventListener('click', function(e) {
    console.log('Fullscreen Button');
    socket.emit("fullscreen", emptyData);
  });
  document.getElementById('volumeButton').addEventListener('click', function(e) {
    console.log('Volume Button');
    socket.emit("muted", emptyData);
  });
  document.getElementById('forwardButton').addEventListener('click', function(e) {
    console.log('Forward Button');
    socket.emit('seeking', window.lastVideoProgress + window.skipTiming);
  });
  document.getElementById('rewindButton').addEventListener('click', function(e) {
    console.log('Rewind Button');
    socket.emit('seeking', window.lastVideoProgress - window.skipTiming);
  });
  socket.on('initial-setup', function(data) {
    console.log(`Initial setup: ${data}`);
    setThemeColor(data.themeColor);
    setSkipTiming(data.skipTiming, data.skipDefault);
    setPlayRate(data.playRate, data.playRateDefault, socket);
  });
  socket.on('update', function(data) {
    // console.log(data);
    setVideoProgress(data['videoprogress'], data['videoduration']);
    setVolume(data['volume'], data['muted']);
    if (data['paused']) {
      document.getElementById('playButtonText').innerText = 'play_arrow';
    } else {
      document.getElementById('playButtonText').innerText = 'pause';
    }
    if (data['fullscreen']) {
      document.getElementById('fsButtonText').innerText = 'fullscreen_exit';
    } else {
      document.getElementById('fsButtonText').innerText = 'fullscreen';
    }
  });

  document.getElementById('progressRange').oninput = function() {
    setProgressTexts(this.value, window.lastVideoDuration);
    socket.emit('seeking', this.value);
  }

  document.getElementById('volumeRange').oninput = function() {
    socket.emit('volume', this.value);
    document.getElementById('volumePercentage').innerText = `${Math.floor(this.value * 100)}%`;
  }

});
