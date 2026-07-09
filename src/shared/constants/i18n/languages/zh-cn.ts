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
    dlAllCt: '将全部 {count} 个文件下载为 ZIP',
    setOpen: '打开设置',
    cls: '关闭',
    twTxt: '查看推文',
    twPanel: '推文文本面板',
    twUrl: '查看原始推文',
    fitOri: '原始大小',
    fitW: '适应宽度',
    fitH: '适应高度',
    fitC: '适应窗口',
    galleryToolbar: '图库工具栏',
    progress: '进度',
    settingsPanel: '设置面板',
  },
  st: {
    th: '主题',
    lang: 'Language / 언어 / 言語 / Idioma / اللغة',
    thAuto: '自动',
    thLt: '浅色',
    thDk: '深色',
    langAuto: 'Auto / 자동 / 自動 / Auto / تلقائي',
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
      },
      noMedia: '未选择媒体项。请重新打开图库后重试。',
      zipFail: 'ZIP 文件保存失败',
    },
    gal: {
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
