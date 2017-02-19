// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from 'path';
import url from 'url';
import fs from 'fs';
import { app, Menu } from 'electron';
import { devMenuTemplate } from './menu/dev_menu_template';
import { editMenuTemplate } from './menu/edit_menu_template';
import createWindow from './helpers/window';
import { ipcMain } from 'electron';
const electron = require('electron');
const os = require('os');

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';

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

var mainWindow, recordedPath;
global.taskClicks = 0;
global.taskEnters = 0;
global.currentTask = 1;
global.taskStart = 0;
global.taskEnd = 0;
global.tasks = [];

var setApplicationMenu = function () {
  var menus = [editMenuTemplate];
  if (env.name !== 'production') {
    menus.push(devMenuTemplate);
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
  var userDataPath = app.getPath('userData');
  app.setPath('userData', userDataPath + ' (' + env.name + ')');
}

app.on('ready', function () {
  setApplicationMenu();

  var mainScreen = electron.screen.getPrimaryDisplay().size;
  options.cropArea.width = mainScreen.width, options.cropArea.height = mainScreen.height;

  var mainWindow = createWindow('main', {
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

  mainWindow.loadURL("http://timetable.brighton.ac.uk/timetabling/homePage.do");

  // if (env.name === 'development') {
  //   mainWindow.openDevTools();
  // }

  ipcMain.on('clickEvent', () => {
    global.taskClicks++;
    // console.log("clicked");
  });
  ipcMain.on('enterEvent', () => {
    global.taskEnters++;
    // console.log("enter pressed");
  });

  ipcMain.on('startTaskEvent', () => {
    console.log(`=====> TASK ${global.currentTask} STARTED. <=====`);
    global.taskStart = new Date().getTime();
    global.taskClicks = 0;
    global.taskEnters = 0;
  });
  ipcMain.on('stopTaskEvent', () => {
    global.taskEnd = new Date().getTime();
    console.log(`=====> TASK ${global.currentTask} ENDED.   <=====`);
    global.tasks.push({"task": global.currentTask,
                      "clicks": global.taskClicks,
                      "enters": global.taskEnters,
                      "time": (global.taskEnd - global.taskStart)/1000 });
    global.currentTask++;
  });


  ipcMain.on('startRecordingEvent', () => {
    console.log('##### RECORDING STARTED. #####');
    aperture.startRecording(options).then(filePath => {
      console.log(filePath);
      recordedPath = filePath;
    });
  });
  ipcMain.on('stopRecordingEvent', () => {
    aperture.stopRecording();
    if ( typeof recordedPath !== 'undefined' && recordedPath ) {
      var dir = os.homedir() + '/Desktop/Recording-'+Math.random().toString(36).substr(2, 5)+'.mp4';
      move(recordedPath.toString(), dir, function(e){console.log(e)});
    }
    console.log('##### RECORDING STOPPED. #####');
  });


});

app.on('window-all-closed', function () {
  app.quit();
});

app.on('before-quit', function () {
  console.log(global.tasks);
});


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
