// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

// Source-derived synthetic markup, not a live authenticated X DOM capture.
// Post IDs (222/333) are distinct from media IDs (900/901).
export const INTERLEAVED_DOM = `<article data-testid="tweet">
  <a href="/author/status/222"><time>Fixture permalink</time></a>
  <div>
    <video src="https://video.twimg.com/ext_tw_video/900/pu/vid/first.mp4" style="width:160px;height:90px"></video>
    <div data-testid="tweetPhoto"><img src="https://pbs.twimg.com/media/first-photo.jpg" width="160" height="90"></div>
    <video src="https://video.twimg.com/ext_tw_video/901/pu/vid/second.mp4" style="width:160px;height:90px"></video>
    <div data-testid="tweetPhoto"><img id="ordered-target" src="https://pbs.twimg.com/media/second-photo.jpg" width="160" height="90"></div>
  </div>
</article>`;

export const STATUS_TILE_DOM = `<div id="tile-grid">
  <a href="/author/status/222/photo/2"><div data-testid="tweetPhoto"><img id="tile-target" src="https://pbs.twimg.com/media/tile-photo.jpg" width="160" height="90"></div></a>
  <a href="/neighbor/status/333/photo/1"><div data-testid="tweetPhoto"><img id="neighbor-target" src="https://pbs.twimg.com/media/neighbor-photo.jpg" width="160" height="90"></div></a>
</div>`;
