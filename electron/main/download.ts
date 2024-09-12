import { ipcMain } from 'electron'
import { createRequire } from 'node:module'
import http from 'http'
import https from 'https'
const require = createRequire(import.meta.url)
const ffmpeg = require('fluent-ffmpeg')
const ffmpegPath = require('ffmpeg-static')
const NodeID3 = require('node-id3')
const fs = require('fs')
const path = require('path')

import { win } from './index'

// 设置 ffmpeg 路径
ffmpeg.setFfmpegPath(ffmpegPath)

interface DownloadSong {
  url: string
  title: string
  cover: string
  author: string
  dir: string  // 新增的 dir 参数
}

import fetch from 'node-fetch'

async function download(song: DownloadSong) {
  const { url: songUrl, title, cover: coverUrl, author, dir } = song

  // 下载音频文件
  const audioFilePath = await downloadFile(songUrl, path.join(dir, `${title}.m4a`))
  win.webContents.send('message:download', {
    status: 'downloading',
    message: '下载音频文件中...'
  })
  // 转换 M4A 到 MP3
  const mp3FilePath = await convertM4AToMP3(audioFilePath, title, dir)
  win.webContents.send('message:download', {
    status: 'converting',
    message: '转换音频文件中...'
  })

  // 下载封面图片
  const coverFilePath = await downloadFile(coverUrl, path.join(dir, `${title}_cover.jpg`))
  win.webContents.send('message:download', {
    status: 'downloading',
    message: '下载封面图片中...'
  })

  // 添加 ID3 标签
  const tags = {
    title: title,
    artist: author,
    album: title,
    APIC: {
      mime: 'image/jpeg',
      type: {
        id: 3,
        name: 'front cover'
      },
      description: 'Cover',
      imageBuffer: fs.readFileSync(coverFilePath)
    }
  }

  win.webContents.send('message:download', {
    status: 'writing',
    message: '写入音频文件中...'
  })

  NodeID3.write(tags, mp3FilePath)

  win.webContents.send('message:download', {
    status: 'cleaning',
    message: '清理临时文件中...'
  })

  // 删除临时文件
  fs.unlinkSync(audioFilePath)
  fs.unlinkSync(coverFilePath)

  // 返回文件路径
  return mp3FilePath
}

function downloadFile(url: string, filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath)
    const protocol = url.startsWith('https') ? https : http

    protocol.get(url, {
      headers: {
        'Referer': 'https://www.bilibili.com',
        'User-Agent': 'Mozilla/5.0 BiliDroid/1.0.0 (bbcallen@gmail.com)'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // 处理重定向
        return downloadFile(response.headers.location, filePath)
          .then(resolve)
          .catch(reject)
      }

      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve(filePath)
      })
    }).on('error', (err) => {
      fs.unlink(filePath, () => { })
      reject(err)
    })
  })
}

function convertM4AToMP3(inputPath: string, title: string, dir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(dir, `${title}.mp3`)
    ffmpeg(inputPath)
      .audioCodec('libmp3lame')
      .toFormat('mp3')
      .on('end', () => {
        resolve(outputPath)
      })
      .on('error', (err: Error) => {
        reject(err)
      })
      .save(outputPath)
  })
}

ipcMain.handle('download:download', async (event, song: DownloadSong) => {
  win.webContents.send('download:start', song)
  return await download(song)
})


