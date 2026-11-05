// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

/** A selected video URL must agree with the MP4 filename assigned downstream. */
export function isDirectMp4Source(url: URL): boolean {
  if (url.hostname !== 'video.twimg.com' || !/\.mp4$/i.test(url.pathname)) {
    return false;
  }

  const formats = [...url.searchParams].filter(([key]) => key.toLowerCase() === 'format');
  return formats.length === 0 || (formats.length === 1 && formats[0]?.[1].toLowerCase() === 'mp4');
}
