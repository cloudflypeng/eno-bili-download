<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const biliUrl = ref('')
const outputPath = ref('')

interface DownloadSong {
  url: string
  title: string
  cover: string
  author: string
  dir: string  // 新增的 dir 参数
}

function getUpUrl(obj: any) {
  const url1 = obj.baseUrl || ''
  const url2 = obj.backup_url?.[0] || ''
  const url3 = obj.backup_url?.[1] || ''

  // 找到第一个不是https://xy 开头的url
  const urlList = [url1, url2, url3].filter(url => !url.startsWith('https://xy'))
  return urlList[0] || url1
}

const getDefaultPath = async () => {
  const result = await window.ipcRenderer.invoke('dir:getDesktopPath')
  outputPath.value = result
}

onMounted(async () => {
  await getDefaultPath()
  window.ipcRenderer.on('message:download', (event, message) => {
    toast.add({ severity: 'info', summary: 'Info', detail: message.message, life: 3000 });
  })
})

const handleFolderSelect = async () => {
    try {
      const result = await window.ipcRenderer.invoke('dialog:openDirectory')
      if (result.filePaths && result.filePaths.length > 0) {
        outputPath.value = result.filePaths[0]
      }
    } catch (error) {
      console.error('选择文件夹失败:', error)
    }
}
const handleDownload = async () => {
  // https://www.bilibili.com/video/BV1rS421X7SW/?spm_
  // 通过正则表达式获取bvid
  // 获取到 BV1rS421X7SW 这部分
  const bvid = biliUrl.value.match(/BV[a-zA-Z0-9]+/)
  if (!bvid) {
    console.error('没有找到bvid')
    return
  }
  const result = await getVideoData(bvid[0])
}

async function getVideoData(bvid: string) {
  const res = await window.ipcRenderer.invoke('api:getCid', bvid)
  if (!res) {
    console.error('没有找到cid')
    return
  }

  const videData = await window.ipcRenderer.invoke('api:getAudioUrl', res.bvid, res.cid)

  if (!videData) {
    console.error('没有找到视频数据')
    return
  }

  let dash = videData.data.dash

  const url = getUpUrl(dash.audio[0])
  // const video = getUpUrl(dash.video[0])

  const song: DownloadSong = {
    url,
    title: res.data.title,
    cover: res.data.pic,
    author: res.data.owner.name,
    dir: outputPath.value,
  }
  toast.add({ severity: 'info', summary: 'Info', detail: '开始下载', life: 3000 });
  await window.ipcRenderer.invoke('download:download', song)
  // biliUrl.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-5 p-10">
    <h1>eno-bili-downloader</h1>
    <div class="flex gap-5 items-center">
      输入url
      <InputText class="w-[300px]" v-model="biliUrl" />
    </div>
    <div class="flex gap-5 items-center">
      选择下载目录
      <InputText v-model="outputPath" class="w-[300px]" />
      <Button label="选择目录" @click="handleFolderSelect" />

    </div>
    <div>
      <Button label="下载" @click="handleDownload" />
    </div>
    <Toast />
  </div>
</template>

