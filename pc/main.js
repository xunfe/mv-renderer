'use strict';
/*
 * P(doom) MV · PC 版主进程
 * - 起一个只监听 127.0.0.1 的本地服务器，页面与 Android 版完全相同
 * - 提供 XmApp 桥：自选音频、导入 zip（对应手机上的两个按钮）
 * - 录制的视频由 /__rec 直接写进系统「下载」目录
 */
const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const { startServer } = require('./server');
const { importZip } = require('./importer');
const { DshPv } = require('./dshpv');

let win = null;
let srv = null;

const WEB_ROOT = path.join(__dirname, 'web');
const ICON = path.join(__dirname, 'icon.ico');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function notifyPage(msg) {
  if (!win) return;
  win.webContents
    .executeJavaScript(`window.__onImport && window.__onImport(${JSON.stringify(String(msg))})`)
    .catch(() => {});
}

function extOf(name) {
  const e = path.extname(name || '').toLowerCase();
  return /^\.[a-z0-9]{1,5}$/.test(e) ? e : '.bin';
}

async function pickAudio(id) {
  const r = await dialog.showOpenDialog(win, {
    title: '选择你自己合法拥有的音频文件',
    properties: ['openFile'],
    filters: [
      { name: '音频', extensions: ['mp3', 'flac', 'm4a', 'wav', 'ogg', 'opus', 'aac'] },
      { name: '全部文件', extensions: ['*'] },
    ],
  });
  if (r.canceled || !r.filePaths.length) return 'cancel';
  const src = r.filePaths[0];
  const ext = extOf(src);
  const key = id || 'world-execute';
  const dir = srv.audioRoot;
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith(key + '.')) await fsp.rm(path.join(dir, f), { force: true });
  }
  await fsp.copyFile(src, path.join(dir, key + ext));
  const msg = 'ok:audio';
  notifyPage(msg);
  return path.basename(src);
}

async function pickZip() {
  const r = await dialog.showOpenDialog(win, {
    title: '导入其他 MV（zip）',
    properties: ['openFile'],
    filters: [{ name: 'MV 压缩包', extensions: ['zip'] }],
  });
  if (r.canceled || !r.filePaths.length) return 'cancel';
  try {
    const id = await importZip(r.filePaths[0], srv.mvRoot);
    notifyPage('ok:' + id);
    return id;
  } catch (e) {
    notifyPage('err:' + e.message);
    return 'err:' + e.message;
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 900,
    minHeight: 560,
    backgroundColor: '#050505',
    title: 'MV渲染器',
    icon: ICON,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  win.setMenuBarVisibility(false);
  win.once('ready-to-show', () => win.show());

  const homeUrl = () => `http://127.0.0.1:${srv.port}/home.html`;

  // 站外链接（官方在线版等）交给系统浏览器
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!/^http:\/\/127\.0\.0\.1:/.test(url)) {
      shell.openExternal(url).catch(() => {});
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!/^http:\/\/127\.0\.0\.1:/.test(url) && !url.startsWith('about:')) {
      e.preventDefault();
      shell.openExternal(url).catch(() => {});
    }
  });

  // 与手机版一样：子页面左上角注入「回到选择页」按钮
  win.webContents.on('did-finish-load', () => {
    const js = `(function(){
      if (location.pathname === '/home.html') return;
      if (document.getElementById('__menubtn')) return;
      var b = document.createElement('button');
      b.id = '__menubtn'; b.textContent = '\\u2630'; b.title = '回到选择页';
      b.style.cssText = 'position:fixed;left:12px;top:12px;z-index:99998;width:40px;height:40px;border-radius:20px;' +
        'border:1px solid #ff4d12;background:#000c;color:#ff4d12;font:18px/1 ui-monospace,monospace;cursor:pointer';
      b.onclick = function(){ location.href = ${JSON.stringify(homeUrl())}; };
      document.body.appendChild(b);
    })();`;
    win.webContents.executeJavaScript(js).catch(() => {});
  });

  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      e.preventDefault();
    } else if (input.key === 'F5') {
      win.webContents.reload();
      e.preventDefault();
    } else if (input.key === 'Escape' && win.isFullScreen()) {
      win.setFullScreen(false);
      e.preventDefault();
    }
  });

  win.loadURL(homeUrl());
  win.on('closed', () => {
    win = null;
  });
}

/** 应用改名后（P(doom) MV → 代码MV渲染器 → MV渲染器），把旧 userData 里导入的 MV 和音频搬过来 */
function migrateUserData() {
  try {
    const newDir = app.getPath('userData');
    if (fs.existsSync(path.join(newDir, 'mv'))) return;
    for (const oldName of ['P(doom) MV', '代码MV渲染器']) {
      const oldDir = path.join(app.getPath('appData'), oldName);
      if (oldDir === newDir || !fs.existsSync(oldDir)) continue;
      fs.mkdirSync(newDir, { recursive: true });
      for (const sub of ['mv', 'audio']) {
        const src = path.join(oldDir, sub);
        if (fs.existsSync(src)) fs.cpSync(src, path.join(newDir, sub), { recursive: true });
      }
      if (fs.existsSync(path.join(newDir, 'mv'))) break;
    }
  } catch (e) {
    console.warn('迁移旧数据失败', e);
  }
}

let dshpv = null;

function initDshPv() {
  dshpv = new DshPv({
    appDir: path.dirname(app.getPath('exe')),
    srcDir: path.join(__dirname, 'dshpv'),
    runtimeDir: path.join(__dirname, 'runtime'),
    onUpdate: (snap) => {
      if (win && !win.isDestroyed()) win.webContents.send('dshpv:update', snap);
    },
  });
  ipcMain.handle('dshpv:status', () => (dshpv ? dshpv.snapshot() : null));
  ipcMain.handle('dshpv:detect', (e, quality) => (dshpv ? dshpv.detect(quality) : null));
  ipcMain.handle('dshpv:start', (e, opts) => (dshpv ? dshpv.start(opts || {}) : null));
  ipcMain.handle('dshpv:cancel', () => (dshpv ? dshpv.cancel() : null));
  ipcMain.handle('dshpv:open', () => {
    const p = dshpv.outputPath();
    if (fs.existsSync(p)) return shell.openPath(p);
    return 'missing';
  });
}

app.whenReady().then(async () => {
  app.setAppUserModelId('com.dsha.xmmv');
  Menu.setApplicationMenu(null);

  ipcMain.handle('pick-audio', (e, id) => pickAudio(id));
  ipcMain.handle('pick-zip', () => pickZip());
  ipcMain.handle('open-external', (e, url) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) shell.openExternal(url).catch(() => {});
  });

  migrateUserData();
  initDshPv();
  srv = await startServer({
    root: WEB_ROOT,
    userData: app.getPath('userData'),
    downloads: app.getPath('downloads'),
  });
  createWindow();

  // 自动化自检（仅当设置了 PC_E2E 环境变量时生效，正常启动完全不受影响）
  if (process.env.PC_E2E) {
    if (process.env.PC_E2E_URL) {
      const target = process.env.PC_E2E_URL.startsWith('/')
        ? `http://127.0.0.1:${srv.port}${process.env.PC_E2E_URL}`
        : process.env.PC_E2E_URL;
      win.webContents.once('did-finish-load', () => win.loadURL(target).catch(() => {}));
    }
    win.webContents.once('did-finish-load', async () => {
      await new Promise((r) => setTimeout(r, 4000));
      try {
        const info = await win.webContents.executeJavaScript(
          '({bridge: typeof XmApp, title: document.title, text: document.body.innerText.slice(0,200)})'
        );
        fs.writeFileSync(process.env.PC_E2E + '.json', JSON.stringify(info, null, 2));
        const img = await win.webContents.capturePage();
        fs.writeFileSync(process.env.PC_E2E, img.toPNG());
      } catch (e) {
        fs.writeFileSync(process.env.PC_E2E + '.err', String(e));
      }
      app.quit();
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', () => {
  if (dshpv) dshpv.cancel();
  if (srv) srv.close().catch(() => {});
});
