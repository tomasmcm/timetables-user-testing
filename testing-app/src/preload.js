var ipcRenderer = require('electron').ipcRenderer;
var remote = require('electron').remote;
var enterKey = 0, click = 0;

window.onkeydown = function (e) {
  var code = e.keyCode ? e.keyCode : e.which;

  if (code === 13) { //ENTER key
    ipcRenderer.send('enterEvent');
    enterKey = remote.getGlobal('taskEnters');
    console.log("Enter Key: " + enterKey);
  } else if (code === 112) { // F1 key
    ipcRenderer.send('startTaskEvent');
  } else if (code === 113) { // F2 key
    ipcRenderer.send('stopTaskEvent');
  } else if (code === 114) { // F3 key
    ipcRenderer.send('startRecordingEvent');
  } else if (code === 115) { // F4 key
    ipcRenderer.send('stopRecordingEvent');
  } else if (code === 116) { // F5 key
    ipcRenderer.send('showStatsEvent');
  } else if (code === 27) { // ESC key
    ipcRenderer.send('reloadEvent');
  }
};


window.addEventListener('click', function(e){
  ipcRenderer.send('clickEvent');
  click = remote.getGlobal('taskClicks');
  console.log("Clicks: " + click);
});
