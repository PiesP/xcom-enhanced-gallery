/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Filename Utilities
 *
 * Phase 351.7: Factory Layer - 파일명 처리 유틸리티
 */

/**
 * 파일명을 안전하게 정리 (확장자 중복 제거, 특수문자 처리)
 *
 * @param filename - 원본 파일명
 * @returns 정리된 파일명
 *
 * @example
 * cleanFilename('  media.jpg  ') // 'media'
 * cleanFilename('user<name>.jpg') // 'user_name_'
 * cleanFilename('') // 'media'
 */
export function cleanFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'media';
  }

  // 기본 정리: 공백 제거, 소문자화
  let cleaned = filename.trim();

  // 이미 확장자가 있으면 제거 (이미지/비디오 확장자)
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
  const allExtensions = [...imageExtensions, ...videoExtensions];

  for (const ext of allExtensions) {
    if (cleaned.toLowerCase().endsWith(ext)) {
      cleaned = cleaned.slice(0, -ext.length);
      break;
    }
  }

  // 파일명이 비어있으면 기본값 반환
  if (!cleaned) {
    return 'media';
  }

  // 특수문자 제거 (파일시스템 안전성)
  cleaned = cleaned.replace(/[<>:"/\\|?*]/g, '_');

  // 길이 제한 (255자는 대부분 파일시스템의 제한)
  if (cleaned.length > 200) {
    cleaned = cleaned.substring(0, 200);
  }

  return cleaned;
}
