// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const httpGet = vi.hoisted(() => vi.fn());
vi.mock('@shared/services/http-request-service', () => ({ getHttpRequestService: () => ({ get: httpGet }) }));
vi.mock('@shared/services/media/twitter-auth/twitter-auth', () => ({ getCsrfTokenAsync: vi.fn(async () => 'fixture'), resolveBearerToken: vi.fn(() => 'Bearer fixture') }));
import { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';

// Source-derived synthetic response; post IDs are distinct from media IDs.
function response() {
  return { data: { tweetResult: { result: {
    rest_id: '222', core: { user_results: { result: { legacy: { screen_name: 'author' } } } },
    legacy: { id_str: '222', full_text: 'Fixture', extended_entities: { media: ['first', 'second'].map((name, index) => ({ type: 'photo', id_str: String(900 + index), media_url_https: `https://pbs.twimg.com/media/${name}.jpg`, expanded_url: `https://x.com/author/status/222/photo/${index + 1}` })) } },
  } } } };
}
function tile() {
  document.body.innerHTML = '<a href="/author/status/222/photo/2"><img id="target" src="https://pbs.twimg.com/media/second.jpg"></a><a href="/other/status/333/photo/1"><img src="https://pbs.twimg.com/media/neighbor.jpg"></a>';
  return document.getElementById('target')!;
}

describe('integrated scoped recovery and delayed identity', () => {
  beforeEach(() => { httpGet.mockReset(); });
  afterEach(() => { vi.restoreAllMocks(); document.body.replaceChildren(); });

  it('keeps tile owner and selection across API success, failure and circuit-open', async () => {
    const service = new MediaExtractionService();
    const target = tile();
    httpGet.mockResolvedValue({ ok: true, status: 200, data: response() });
    const api = await service.extractFromClickedElement(target);
    expect(api.success).toBe(true);
    expect(api.clickedIndex).toBe(1);
    expect(api.metadata?.recoveryScope).toBeUndefined();
    httpGet.mockResolvedValue({ ok: false, status: 503, data: {} });
    for (let click = 0; click < 4; click++) {
      const dom = await service.extractFromClickedElement(target);
      expect(dom.success).toBe(true);
      expect(dom.mediaItems.map((item) => item.url)).toEqual(['https://pbs.twimg.com/media/second.jpg']);
      expect(dom.metadata?.recoveryScope).toBe('visible-tile');
    }
    expect(httpGet).toHaveBeenCalledTimes(4);
    for (const [url] of httpGet.mock.calls) expect(JSON.parse(new URL(url).searchParams.get('variables')!).tweetId).toBe('222');
  });

  it.each(['removed', 'replaced', 'reused'] as const)('preserves API click identity when target is %s', async (kind) => {
    let finish!: (value: { ok: boolean; status: number; data: ReturnType<typeof response> }) => void;
    httpGet.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const target = tile();
    const pending = new MediaExtractionService().extractFromClickedElement(target);
    await vi.waitFor(() => expect(httpGet).toHaveBeenCalledTimes(1));
    if (kind === 'removed') target.remove();
    if (kind === 'replaced') target.outerHTML = '<img src="https://pbs.twimg.com/media/first.jpg">';
    if (kind === 'reused') target.setAttribute('src', 'https://pbs.twimg.com/media/first.jpg');
    finish({ ok: true, status: 200, data: response() });
    const result = await pending;
    expect(result.success).toBe(true);
    expect(result.clickedIndex).toBe(1);
    expect(result.mediaItems[1]?.url).toContain('second');
  });

  it('safely fails DOM recovery if a pending failed request reuses a target', async () => {
    let finish!: (value: { ok: boolean; status: number; data: object }) => void;
    httpGet.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const target = tile();
    const pending = new MediaExtractionService().extractFromClickedElement(target);
    await vi.waitFor(() => expect(httpGet).toHaveBeenCalledTimes(1));
    target.setAttribute('src', 'https://pbs.twimg.com/media/first.jpg');
    finish({ ok: false, status: 503, data: {} });
    expect((await pending).success).toBe(false);
  });

  it('preserves the clicked duplicate through DOM filtering and final deduplication', async () => {
    httpGet.mockResolvedValue({ ok: false, status: 503, data: {} });
    document.body.innerHTML = '<article><a href="/author/status/222"><time>Now</time></a><div><img src="https://pbs.twimg.com/media/same.jpg"><img src="https://pbs.twimg.com/profile_images/900/avatar.jpg"><img id="target" src="https://pbs.twimg.com/media/same.jpg"></div></article>';
    const result = await new MediaExtractionService().extractFromClickedElement(document.getElementById('target')!);
    expect(result.success).toBe(true);
    expect(result.mediaItems).toHaveLength(1);
    expect(result.clickedIndex).toBe(0);
  });
});
