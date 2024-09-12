import { ipcMain } from 'electron'

// https://api.bilibili.com/x/web-interface/view?bvid=BV1BL411Y7kc
// 需要这个获取cid
// 用fetch

const getCid = async (bvid: string) => {
  const res = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`)
  const data = await res.json()
  return { cid: data.data.cid, bvid, data: data.data }
}

// https://api.bilibili.com/x/player/playurl?fnval=16&bvid=BV1jh4y1G7oT&cid=1157282735
// 需要这个获取音频和视频的url
// 用fetch
const getAudioUrl = async (bvid: string, cid: string) => {
  const res = await fetch(`https://api.bilibili.com/x/player/playurl?fnval=16&bvid=${bvid}&cid=${cid}`)
  const data = await res.json()
  return data
}
// 需要这个获取音频和视频的url

ipcMain.handle('api:getCid', async (event, bvid: string) => {
  try {
    return await getCid(bvid)
  }
  catch (e) {
    console.error(e)
    return null
  }
})

ipcMain.handle('api:getAudioUrl', async (event, bvid: string, cid: string) => {
  try {
    return await getAudioUrl(bvid, cid)
  }
  catch (e) {
    console.error(e)
    return null
  }
})

