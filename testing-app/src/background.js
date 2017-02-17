// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from 'path';
import url from 'url';
import { app, Menu } from 'electron';
import { devMenuTemplate } from './menu/dev_menu_template';
import { editMenuTemplate } from './menu/edit_menu_template';
import createWindow from './helpers/window';
import { globalShortcut, ipcMain } from 'electron';

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';

var mainWindow;
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
    console.log(`Task ${global.currentTask} started.`);
    global.taskStart = new Date().getTime();
    global.taskClicks = 0;
    global.taskEnters = 0;
  });
  ipcMain.on('stopTaskEvent', () => {
    global.taskEnd = new Date().getTime();
    console.log(`Task ${global.currentTask} ended.`);
    global.tasks.push({"task": global.currentTask,
                       "clicks": global.taskClicks,
                       "enters": global.taskEnters,
                       "time": (global.taskEnd - global.taskStart)/1000 });
    global.currentTask++;
  });

});

app.on('window-all-closed', function () {
  app.quit();
});

app.on('before-quit', function () {
  console.log(global.tasks);
});
