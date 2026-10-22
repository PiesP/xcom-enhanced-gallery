// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const httpGet = vi.hoisted(() => vi.fn());
vi.mock('@shared/services/http-request-service', () => ({
  getHttpRequestService: () => ({ get: httpGet }),
}));
vi.mock('@shared/services/media/twitter-auth/twitter-auth', () => ({
  getCsrfTokenAsync: vi.fn(async () => 'fixture'),
  resolveBearerToken: vi.fn(() => 'Bearer fixture'),
}));

import { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';

// Source-derived synthetic response; post IDs are distinct from media IDs.
function response() {
  return {
    data: {
      tweetResult: {
        result: {
          rest_id: '222',
          core: { user_results: { result: { legacy: { screen_name: 'author' } } } },
          legacy: {
            id_str: '222',
            full_text: 'Fixture',
            extended_entities: {
              media: ['first', 'second'].map((name, index) => ({
                type: 'photo',
                id_str: String(900 + index),
                media_url_https: `https://pbs.twimg.com/media/${name}.jpg`,
                expanded_url: `https://x.com/author/status/222/photo/${index + 1}`,
              })),
            },
          },
        },
      },
    },
  };
}
function tile() {
  document.body.innerHTML =
    '<a href="/author/status/222/photo/2"><img id="target" src="https://pbs.twimg.com/media/second.jpg"></a><a href="/other/status/333/photo/1"><img src="https://pbs.twimg.com/media/neighbor.jpg"></a>';
  return document.getElementById('target')!;
}

describe('integrated scoped recovery and delayed identity', () => {
  beforeEach(() => {
    httpGet.mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('keeps tile owner and selection across API success, failure and circuit-open', async () => {
    const service = new MediaExtractionService();
    const target = tile();
    httpGet.mockResolvedValue({ ok: true, status: 200, data: response() });
    const api = await service.extractFromClickedElement(target);
    expect(api.success).toBe(true);
    expect(api.clickedIndex).toBe(1);
    expect(api.metadata?.recoveryScope).toBeUndefined();
    service.invalidateApiMetadata();
    httpGet.mockResolvedValue({ ok: false, status: 503, data: {} });
    for (let click = 0; click < 4; click++) {
      const dom = await service.extractFromClickedElement(target);
      expect(dom.success).toBe(true);
      expect(dom.mediaItems.map((item) => item.url)).toEqual([
        'https://pbs.twimg.com/media/second.jpg',
      ]);
      expect(dom.metadata?.recoveryScope).toBe('visible-tile');
    }
    expect(httpGet).toHaveBeenCalledTimes(4);
    for (const [url] of httpGet.mock.calls) {
      expect(JSON.parse(new URL(url).searchParams.get('variables')!).tweetId).toBe('222');
    }
  });

  it.each(['removed', 'replaced', 'reused', 'owner-changed'] as const)(
    'preserves API click identity when target is %s',
    async (kind) => {
      let finish!: (value: {
        ok: boolean;
        status: number;
        data: ReturnType<typeof response>;
      }) => void;
      httpGet.mockReturnValue(
        new Promise((resolve) => {
          finish = resolve;
        })
      );
      const target = tile();
      const pending = new MediaExtractionService().extractFromClickedElement(target);
      await vi.waitFor(() => expect(httpGet).toHaveBeenCalledTimes(1));
      if (kind === 'removed') {
        target.remove();
      }
      if (kind === 'replaced') {
        target.outerHTML = '<img src="https://pbs.twimg.com/media/first.jpg">';
      }
      if (kind === 'reused') {
        target.setAttribute('src', 'https://pbs.twimg.com/media/first.jpg');
      }
      if (kind === 'owner-changed') {
        target.closest('a')!.href = '/other/status/333/photo/2';
      }
      finish({ ok: true, status: 200, data: response() });
      const result = await pending;
      expect(result.success).toBe(true);
      expect(result.clickedIndex).toBe(1);
      expect(result.mediaItems[1]?.url).toContain('second');
    }
  );

  it.each(['removed', 'replaced', 'reused', 'owner-changed'] as const)(
    'refuses current-DOM recovery when a failed request target is %s',
    async (kind) => {
      let finish!: (value: { ok: boolean; status: number; data: object }) => void;
      httpGet.mockReturnValue(
        new Promise((resolve) => {
          finish = resolve;
        })
      );
      const target = tile();
      const service = new MediaExtractionService();
      try {
        const pending = service.extractFromClickedElement(target);
        await vi.waitFor(() => expect(httpGet).toHaveBeenCalledTimes(1));
        if (kind === 'removed') {
          target.remove();
        } else if (kind === 'replaced') {
          target.outerHTML = '<img src="https://pbs.twimg.com/media/first.jpg">';
        } else if (kind === 'reused') {
          target.setAttribute('src', 'https://pbs.twimg.com/media/first.jpg');
        } else {
          target.closest('a')!.href = '/other/status/333/photo/2';
        }
        finish({ ok: false, status: 503, data: {} });
        const result = await pending;
        expect(result.success).toBe(false);
        expect(result.mediaItems).toEqual([]);
        expect(httpGet).toHaveBeenCalledTimes(1);
      } finally {
        service.dispose();
      }
    }
  );

  it('coalesces concurrent metadata while selecting each actual clicked attachment independently', async () => {
    let finish!: (value: unknown) => void;
    httpGet.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    document.body.innerHTML =
      '<a href="/author/status/222/photo/1"><img id="first" src="https://pbs.twimg.com/media/first.jpg"></a><a href="/author/status/222/photo/2"><img id="second" src="https://pbs.twimg.com/media/second.jpg"></a>';
    const service = new MediaExtractionService();
    try {
      const first = service.extractFromClickedElement(document.getElementById('first')!);
      const second = service.extractFromClickedElement(document.getElementById('second')!);
      await vi.waitFor(() => expect(httpGet).toHaveBeenCalledTimes(1));
      finish({ ok: true, status: 200, data: response() });
      const results = await Promise.all([first, second]);
      expect(results.map((result) => result.success)).toEqual([true, true]);
      expect(results.map((result) => result.clickedIndex)).toEqual([0, 1]);
      expect(results.map((result) => result.mediaItems[result.clickedIndex ?? -1]?.url)).toEqual([
        'https://pbs.twimg.com/media/first.jpg?format=jpg&name=orig',
        'https://pbs.twimg.com/media/second.jpg?format=jpg&name=orig',
      ]);
      expect(results[0]?.apiRequestToken).toBe(results[1]?.apiRequestToken);
      expect(httpGet).toHaveBeenCalledTimes(1);
    } finally {
      service.dispose();
    }
  });

  it.each(['success', 'failure'] as const)(
    'selects the final A attachment through real metadata reuse after late first-A %s',
    async (lateOutcome) => {
      const requests: {
        tweetId: string;
        resolve: (value: unknown) => void;
        reject: (reason: unknown) => void;
      }[] = [];
      httpGet.mockImplementation(
        (url: string) =>
          new Promise((resolve, reject) => {
            const { tweetId } = JSON.parse(new URL(url).searchParams.get('variables')!);
            requests.push({ tweetId, resolve, reject });
          })
      );
      document.body.innerHTML =
        '<a href="/author/status/222/photo/1"><img id="first-a" src="https://pbs.twimg.com/media/first.jpg"></a><a href="/other/status/333/photo/1"><img id="b" src="https://pbs.twimg.com/media/other.jpg"></a><a href="/author/status/222/photo/2"><img id="final-a" src="https://pbs.twimg.com/media/second.jpg"></a>';
      const service = new MediaExtractionService();
      const firstController = new AbortController();
      const middleController = new AbortController();
      try {
        const first = service.extractFromClickedElement(document.getElementById('first-a')!, {
          signal: firstController.signal,
        });
        await vi.waitFor(() => expect(requests).toHaveLength(1));
        firstController.abort();
        const middle = service.extractFromClickedElement(document.getElementById('b')!, {
          signal: middleController.signal,
        });
        await vi.waitFor(() => expect(requests).toHaveLength(2));
        middleController.abort();
        const final = service.extractFromClickedElement(document.getElementById('final-a')!);
        await vi.waitFor(() => expect(requests).toHaveLength(3));
        expect(requests.map((request) => request.tweetId)).toEqual(['222', '333', '222']);

        requests[2]!.resolve({ ok: true, status: 200, data: response() });
        const selected = await final;
        expect(selected.success).toBe(true);
        expect(selected.clickedIndex).toBe(1);
        expect(selected.mediaItems[1]).toMatchObject({
          url: 'https://pbs.twimg.com/media/second.jpg?format=jpg&name=orig',
          tweetId: '222',
        });

        if (lateOutcome === 'success') {
          const stale = response();
          stale.data.tweetResult.result.legacy.extended_entities.media.reverse();
          requests[0]!.resolve({ ok: true, status: 200, data: stale });
        } else {
          requests[0]!.reject(new Error('late retired first-A transport failure'));
        }
        requests[1]!.reject(new Error('late retired B transport failure'));
        expect((await first).success).toBe(false);
        expect((await middle).success).toBe(false);
        const reused = await service.extractFromClickedElement(document.getElementById('final-a')!);
        expect(reused.success).toBe(true);
        expect(reused.clickedIndex).toBe(1);
        expect(reused.mediaItems[1]?.url).toBe(
          'https://pbs.twimg.com/media/second.jpg?format=jpg&name=orig'
        );
        expect(httpGet).toHaveBeenCalledTimes(3);
      } finally {
        service.dispose();
      }
    }
  );

  it('does not substitute a replaced image after a delayed HTTP failure when the old background remains', async () => {
    let finish!: (value: { ok: boolean; status: number; data: object }) => void;
    httpGet.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    document.body.innerHTML =
      '<article><a href="/author/status/222"><time>Now</time></a><div style="background-image: url(https://pbs.twimg.com/media/review-A.jpg)"><img id="target" src="https://pbs.twimg.com/media/review-A.jpg"></div></article>';
    const target = document.getElementById('target')!;
    const pending = new MediaExtractionService().extractFromClickedElement(target);
    await vi.waitFor(() => expect(httpGet).toHaveBeenCalledTimes(1));
    target.setAttribute('src', 'https://pbs.twimg.com/media/review-B.jpg');
    finish({ ok: false, status: 503, data: {} });
    const result = await pending;
    expect(result.success).toBe(false);
    expect(result.mediaItems.some((item) => item.url.includes('review-B.jpg'))).toBe(false);
  });

  it('preserves the clicked duplicate through DOM filtering and final deduplication', async () => {
    httpGet.mockResolvedValue({ ok: false, status: 503, data: {} });
    document.body.innerHTML =
      '<article><a href="/author/status/222"><time>Now</time></a><div><img src="https://pbs.twimg.com/media/same.jpg"><img src="https://pbs.twimg.com/profile_images/900/avatar.jpg"><img id="target" src="https://pbs.twimg.com/media/same.jpg"></div></article>';
    const result = await new MediaExtractionService().extractFromClickedElement(
      document.getElementById('target')!
    );
    expect(result.success).toBe(true);
    expect(result.mediaItems).toHaveLength(1);
    expect(result.clickedIndex).toBe(0);
  });
});
