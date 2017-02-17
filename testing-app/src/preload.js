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
  }
};


window.addEventListener('click', function(e){
  ipcRenderer.send('clickEvent');
  click = remote.getGlobal('taskClicks');
  console.log("Clicks: " + click);
});
