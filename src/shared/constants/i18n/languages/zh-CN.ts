// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { LanguageStrings } from '@shared/constants/i18n/language-types';

/**
 * Simplified Chinese language strings for the application
 */
export const zhCn: LanguageStrings = {
  tb: {
    prev: '上一个',
    next: '下一个',
    dl: '下载',
    dlAllCt: '将显示的 {count} 个文件下载为 ZIP',
    setOpen: '打开设置',
    cls: '关闭',
    twTxt: '查看推文',
    twPanel: '推文文本面板',
    twUrl: '查看原始推文',
    fitOri: '原始大小',
    fitW: '适应宽度',
    fitH: '适应高度',
    fitC: '适应窗口',
    currentFit: '适配：{mode}',
    mediaPosition: '媒体 {index}/{total}',
    noMedia: '没有媒体',
    galleryToolbar: '图库工具栏',
    navigationGroup: '导航和当前位置',
    fitGroup: '视图适配',
    downloadGroup: '下载',
    auxGroup: '更多操作',
    settingsPanel: '设置面板',
  },
  st: {
    th: '主题',
    lang: '语言',
    thAuto: '自动',
    thLt: '浅色',
    thDk: '深色',
    langAuto: '自动',
    langKo: '韩语',
    langEn: '英语',
    langJa: '日语',
    langZhCn: '简体中文',
    langEs: '西班牙语',
    langAr: '阿拉伯语',
  },
  msg: {
    err: {
      t: '发生错误',
      b: '发生了意外错误：{error}',
      loadMedia: {
        unsupported: '此视频仅提供 HLS 流。图库播放和下载需要经过确认的 MP4 来源。',
        noMedia: '此帖子未返回媒体内容。',
        denied: '媒体服务拒绝了请求。请稍后重试。',
        unreadable: '无法读取媒体响应。请稍后重试。',
        rateLimited: '媒体服务限制了请求频率。请稍后重试。',
        deferred: '媒体服务要求等待。请稍后重试。',
        providerError: '媒体服务无法提供此帖子。请稍后重试。',
        transport: '无法连接到媒体服务。请稍后重试。',
        ownerUnconfirmed: '无法确认所选媒体属于哪个帖子。',
        mismatch: '返回的媒体与所选项目不匹配。',
        cancelled: '媒体加载已取消。',
        nativeVideoRecovery: '要继续观看，请使用 X 视频的播放或暂停控件。',
        title: '加载媒体失败',
        body: '找不到图片或视频。',
      },
      generic: '发生错误',
      loadGallery: '加载图库失败',
      settingsUnavailable: {
        title: '设置不可用',
        body: '设置加载完成前将使用默认值。',
      },
      retry: '重试',
      noMoreRetries: '无法继续重试',
      reset: '重置',
    },
    kb: {
      t: '键盘快捷键',
      prev: 'ArrowLeft：上一个媒体',
      next: 'ArrowRight：下一个媒体',
      cls: 'Escape：关闭画廊',
      toggle: '？：显示此帮助',
    },
    dl: {
      status: {
        working: '正在准备下载…',
        handedOff: '已交由浏览器处理',
        error: '下载失败',
      },
      one: {
        err: {
          t: '下载失败',
          b: '无法下载文件：{error}',
        },
      },
      allFail: {
        t: '下载失败',
        b: '所有项目下载失败。',
      },
      part: {
        t: '部分失败',
        b: '{count} 个项目下载失败。',
        resourceLimit:
          'ZIP 中包含 {count} 个文件；另有 {failed} 个文件未包含在内。已达到下载内存上限。请先等待正在进行的下载完成。如果没有进行中的下载，但仍达到上限，请重新加载此页面。然后减少文件数量并重试。',
      },
      noMedia: '未选择媒体项。请重新打开图库后重试。',
      zipFail: 'ZIP 文件保存失败',
      sourceUnavailable: '无法确认原始图像来源，因此未保存此项目。请重新打开帖子后重试。',
      resourceLimit:
        '已达到下载内存上限。请先等待正在进行的下载完成。如果没有进行中的下载，但仍达到上限，请重新加载此页面。然后减少文件数量并重试。',
    },
    gal: {
      video: {
        playbackFallback: '播放使用其他画质；下载仍使用可用的最佳来源。',
      },
      observedQuality: {
        title: '恢复来源的质量',
        body: '无法确认部分项目的来源质量。未确认原始来源的图像无法保存；恢复的视频使用页面显示的来源保存。',
      },
      partialRecovery: {
        title: '仅恢复可见媒体',
        body: '仅恢复了此卡片中的媒体。批量下载仅包含显示的项目。',
      },
      emptyT: '无可用媒体',
      emptyD: '没有可显示的图片或视频。',
      itemLbl: '媒体 {index}：{filename}',
      loadFail: '{type} 加载失败',
      imageGallery: '图片库',
      loading: '加载中',
      videoCount: '视频 {index}/{total}',
      imageCount: '图片 {index}/{total}：{alt}',
      hashtagLabel: '话题标签 {value}',
    },
  },
};
