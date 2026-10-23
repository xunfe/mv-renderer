'use strict';
// 页面里只认 XmApp 这个桥（和手机版同名），实现换成桌面端
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('XmApp', {
  mode: () => 'app',
  pickAudio: (id) => ipcRenderer.invoke('pick-audio', id || 'world-execute'),
  pickZip: () => ipcRenderer.invoke('pick-zip'),
  openExternal: (url) => ipcRenderer.invoke('open-external', String(url || '')),
  dshpv: {
    status: () => ipcRenderer.invoke('dshpv:status'),
    detect: (quality) => ipcRenderer.invoke('dshpv:detect', quality || null),
    start: (opts) => ipcRenderer.invoke('dshpv:start', opts || {}),
    cancel: () => ipcRenderer.invoke('dshpv:cancel'),
    open: () => ipcRenderer.invoke('dshpv:open'),
    onUpdate: (cb) => {
      const fn = (_e, snap) => cb(snap);
      ipcRenderer.on('dshpv:update', fn);
      return () => ipcRenderer.removeListener('dshpv:update', fn);
    },
  },
});

// 渲染页用的顶层桥（页面里直接读 window.DshPv）
contextBridge.exposeInMainWorld('DshPv', {
  status: () => ipcRenderer.invoke('dshpv:status'),
  detect: (quality) => ipcRenderer.invoke('dshpv:detect', quality || null),
  start: (opts) => ipcRenderer.invoke('dshpv:start', opts || {}),
  cancel: () => ipcRenderer.invoke('dshpv:cancel'),
  open: () => ipcRenderer.invoke('dshpv:open'),
  onUpdate: (cb) => {
    const fn = (_e, snap) => cb(snap);
    ipcRenderer.on('dshpv:update', fn);
    return () => ipcRenderer.removeListener('dshpv:update', fn);
  },
});
