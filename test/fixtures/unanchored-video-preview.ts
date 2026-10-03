// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** Sanitized main preview with a quoted link before the owner's permalink. */
export const unanchoredVideoPreview = `
  <article data-testid="tweet">
    <div data-testid="tweetPhoto">
      <div data-testid="previewInterstitial" aria-label="담아간 동영상">
        <img id="main-poster" alt="담아간 동영상"
          src="https://pbs.twimg.com/ext_tw_video_thumb/333/pu/img/quote-video.jpg">
        <button data-testid="playButton" aria-label="이 동영상 재생">Play</button>
      </div>
    </div>
    <div role="link" data-testid="quoteTweet">
      <a role="link" href="/original_author/status/111/photo/1">
        <div data-testid="tweetPhoto">
          <img id="quoted-photo" src="https://pbs.twimg.com/media/quoted-image.jpg">
        </div>
      </a>
    </div>
    <a role="link" href="/quote_author/status/222"><time>Timestamp</time></a>
  </article>
`;
