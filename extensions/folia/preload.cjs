'use strict';
const { contextBridge, ipcRenderer } = require('electron');

// A narrow bridge for the offline visualizer window.
contextBridge.exposeInMainWorld('lxStage', {
  onPacket: callback => { const listener = (_event, packet) => callback(packet); ipcRenderer.on('lx-folia-packet', listener); return () => ipcRenderer.removeListener('lx-folia-packet', listener); },
  ready: () => ipcRenderer.invoke('lx-folia-ready'),
  configure: patch => ipcRenderer.invoke('lx-folia-configure', patch),
  transport: action => ipcRenderer.invoke('lx-folia-control', action),
});
