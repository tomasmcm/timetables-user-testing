(function () {'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = require('path');
var url = require('url');
var fs = _interopDefault(require('fs'));
var electron = require('electron');
var jetpack = _interopDefault(require('fs-jetpack'));

var devMenuTemplate = {
    label: 'Development',
    submenu: [{
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function () {
            electron.BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache();
        }
    },{
        label: 'Toggle DevTools',
        accelerator: 'Alt+CmdOrCtrl+I',
        click: function () {
            electron.BrowserWindow.getFocusedWindow().toggleDevTools();
        }
    }]
};

var menuTemplate = [{
  label: 'File',
  submenu: [{
    label: 'Quit',
    accelerator: 'CmdOrCtrl+Q',
    click: function () {
      electron.app.quit();
    }
  }]
},{
  label: 'Edit',
  submenu: [
    { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
    { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
    { type: "separator" },
    { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
    { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
    { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
    { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
  ]
}];

// This helper remembers the size and position of your windows (and restores
// them in that place after app relaunch).
// Can be used for more than one window, just construct many
// instances of it and give each different name.

var createWindow = function (name, options) {

    var userDataDir = jetpack.cwd(electron.app.getPath('userData'));
    var stateStoreFile = 'window-state-' + name +'.json';
    var defaultSize = {
        width: options.width,
        height: options.height
    };
    var state = {};
    var win;

    var restore = function () {
        var restoredState = {};
        try {
            restoredState = userDataDir.read(stateStoreFile, 'json');
        } catch (err) {
            // For some reason json can't be read (might be corrupted).
            // No worries, we have defaults.
        }
        return Object.assign({}, defaultSize, restoredState);
    };

    var getCurrentPosition = function () {
        var position = win.getPosition();
        var size = win.getSize();
        return {
            x: position[0],
            y: position[1],
            width: size[0],
            height: size[1]
        };
    };

    var windowWithinBounds = function (windowState, bounds) {
        return windowState.x >= bounds.x &&
            windowState.y >= bounds.y &&
            windowState.x + windowState.width <= bounds.x + bounds.width &&
            windowState.y + windowState.height <= bounds.y + bounds.height;
    };

    var resetToDefaults = function (windowState) {
        var bounds = electron.screen.getPrimaryDisplay().bounds;
        return Object.assign({}, defaultSize, {
            x: (bounds.width - defaultSize.width) / 2,
            y: (bounds.height - defaultSize.height) / 2
        });
    };

    var ensureVisibleOnSomeDisplay = function (windowState) {
        var visible = electron.screen.getAllDisplays().some(function (display) {
            return windowWithinBounds(windowState, display.bounds);
        });
        if (!visible) {
            // Window is partially or fully not visible now.
            // Reset it to safe defaults.
            return resetToDefaults(windowState);
        }
        return windowState;
    };

    var saveState = function () {
        if (!win.isMinimized() && !win.isMaximized()) {
            Object.assign(state, getCurrentPosition());
        }
        userDataDir.write(stateStoreFile, state, { atomic: true });
    };

    state = ensureVisibleOnSomeDisplay(restore());

    win = new electron.BrowserWindow(Object.assign({}, options, state));

    win.on('close', saveState);

    return win;
};

// Simple wrapper exposing environment variables to rest of the code.

// The variables have been written to `env.json` by the build process.
var env = jetpack.cwd(__dirname).read('env.json', 'json');

// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

const electron$1 = require('electron');
const os = require('os');
const logDir = os.homedir() + '/Desktop/Test-'+Math.random().toString(36).substr(2, 5)+'.txt';

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
const aperture = require('aperture')();
var options = {
  fps: 30,
  cropArea: {
    x: 0,
    y: 0,
    width: 500,
    height: 500
  },
  showCursor: true,
  highlightClicks: true,
  audioSourceId: 'AppleHDAEngineInput:1B,0,1,0:1'
};

var mainWindow;
var recordedPath;
global.taskClicks = 0;
global.taskEnters = 0;
global.currentTask = 1;
global.taskStart = 0;
global.taskEnd = 0;
global.tasks = [];

var setApplicationMenu = function () {
  var menus = menuTemplate;
  menus.push(optionMenuTemplate);
  if (env.name !== 'production') {
    menus.push(devMenuTemplate);
  }
  electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate(menus));
};

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
  var userDataPath = electron.app.getPath('userData');
  electron.app.setPath('userData', userDataPath + ' (' + env.name + ')');
}

electron.app.on('ready', function () {
  setApplicationMenu();

  var mainScreen = electron$1.screen.getPrimaryDisplay().size;
  options.cropArea.width = mainScreen.width, options.cropArea.height = mainScreen.height;

  mainWindow = createWindow('main', {
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      plugins: true,
      preload: __dirname + '/preload.js',
      allowDisplayingInsecureContent: true,
      scrollBounce: false
    }
  });
  mainWindow.maximize();

  mainWindow.loadURL(env.url);

  mainWindow.on('page-title-updated', function(event){
    event.preventDefault();
  });

  // if (env.name === 'development') {
  //   mainWindow.openDevTools();
  // }

  electron.ipcMain.on('clickEvent', () => {
    global.taskClicks++;
    // console.log("clicked");
  });
  electron.ipcMain.on('enterEvent', () => {
    global.taskEnters++;
    // console.log("enter pressed");
  });

  electron.ipcMain.on('startTaskEvent', startTaskEvent);

  electron.ipcMain.on('stopTaskEvent', stopTaskEvent );

  electron.ipcMain.on('startRecordingEvent', () => startRecordingEvent);

  electron.ipcMain.on('stopRecordingEvent', stopRecordingEvent );

  electron.ipcMain.on('showStatsEvent', showStatsEvent );

  electron.ipcMain.on('reloadEvent', reloadEvent );

});

electron.app.on('window-all-closed', function () {
  electron.app.quit();
});

electron.app.on('before-quit', function () {
  console.log(global.tasks);
  fs.appendFile(logDir, JSON.stringify(global.tasks, null, 4), function (err) {
    if (err) {
      // append failed
      console.log(err);
    } else {
      // done
      console.log(logDir);
    }
  });
});


function startTaskEvent() {
  console.log(`=====> TASK ${global.currentTask} STARTED. <=====`);
  global.taskStart = new Date().getTime();
  global.taskClicks = 0;
  global.taskEnters = 0;
  mainWindow.setTitle(`TASK ${global.currentTask} STARTED.`);
}
function stopTaskEvent() {
  global.taskEnd = new Date().getTime();
  console.log(`=====> TASK ${global.currentTask} ENDED.   <=====`);
  global.tasks.push({"task": global.currentTask,
  "clicks": global.taskClicks,
  "enters": global.taskEnters,
  "time": (global.taskEnd - global.taskStart)/1000 });
  global.currentTask++;
  mainWindow.setTitle(`TASK ${global.currentTask} ENDED.`);
}
function startRecordingEvent() {
  console.log('##### RECORDING STARTED. #####');
  aperture.startRecording(options).then(filePath => {
    console.log(filePath);
    recordedPath = filePath;
  });
  mainWindow.setTitle('RECORDING STARTED.');
}
function stopRecordingEvent() {
  aperture.stopRecording();
  if ( typeof recordedPath !== 'undefined' && recordedPath ) {
    var dir = os.homedir() + '/Desktop/Recording-'+Math.random().toString(36).substr(2, 5)+'.mp4';
    move(recordedPath.toString(), dir, function(e){console.log(e);});
  }
  console.log('##### RECORDING STOPPED. #####');
  mainWindow.setTitle('RECORDING STOPPED.');
}
function showStatsEvent() {
  electron.dialog.showMessageBox({
    title: "Stats",
    message: "User Testing Stats: \n" + JSON.stringify(global.tasks, null, 4)
  });
}
function reloadEvent() {
  console.log(env.url);
  mainWindow.loadURL(env.url);
}

var optionMenuTemplate = {
  label: 'Option',
  submenu: [{
    label: 'Reload Test Page',
    accelerator: 'ESC',
    click: function () {
      reloadEvent();
    }
  },{
    label: 'Start Task',
    accelerator: 'F1',
    click: function () {
      startTaskEvent();
    }
  },{
    label: 'Stop Task',
    accelerator: 'F2',
    click: function () {
      stopTaskEvent();
    }
  },{
    label: 'Start Recording',
    accelerator: 'F3',
    click: function () {
      startRecordingEvent();
    }
  },{
    label: 'Stop Recording',
    accelerator: 'F4',
    click: function () {
      stopRecordingEvent();
    }
  },{
    label: 'Show Stats',
    accelerator: 'F5',
    click: function () {
      showStatsEvent();
    }
  }]
};


function move(oldPath, newPath, callback) {

  fs.rename(oldPath, newPath, function (err) {
    if (err) {
      if (err.code === 'EXDEV') {
        copy();
      } else {
        callback(err);
      }
      return;
    }
    callback(newPath);
  });

  function copy() {
    var readStream = fs.createReadStream(oldPath);
    var writeStream = fs.createWriteStream(newPath);

    readStream.on('error', callback);
    writeStream.on('error', callback);

    readStream.on('close', function () {
      fs.unlink(oldPath, callback);
    });

    readStream.pipe(writeStream);
  }
}

}());
//# sourceMappingURL=background.js.map