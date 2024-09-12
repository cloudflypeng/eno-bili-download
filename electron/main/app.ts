import { ipcMain, dialog } from 'electron';
import path from 'path';
import os from 'os';

ipcMain.handle('dir:getDesktopPath', (event) => {
  return path.join(os.homedir(), 'Desktop');
})

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result
})
