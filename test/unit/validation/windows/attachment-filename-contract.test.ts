// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { copyFile, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it } from 'vite-plus/test';
import { normalizeOriginalImageUrl } from '@shared/utils/media/media-source';
import {
  attachmentFilenameApiResponse,
  attachmentFilenamePageHtml,
  loadAttachmentFilenameFixtureHtml,
  COMPACT_INNER_ID,
  COMPACT_MIDDLE_ID,
} from '../../../../validation/windows/install-preparation.ts';
import { createExtensionNativeFixtureHandler } from '../../../../validation/windows/extension-native-loopback.ts';
import {
  attachmentFilenameUserscriptHtml,
  MEDIA_COHORTS,
  fixtureFilename,
} from '../../../../validation/windows/userscript-document.ts';

describe('installed attachment filename fixture', () => {
  it('gives the installed userscript a trusted visible photo/2 source and literal saved name', () => {
    const marker = MEDIA_COHORTS.normal[0];
    assert(marker);
    const html = attachmentFilenameUserscriptHtml(marker);
    assert.match(html, /\/testuser\/status\/1234567890123456789\/photo\/2/u);
    assert.match(html, new RegExp(`media/${marker}\\.jpg\\?format=jpg&amp;name=large`, 'u'));
    assert.equal(fixtureFilename(1), 'testuser_1234567890123456789_1.jpg');
  });
  it('loads the page from only installation-admitted packaged assets', async () => {
    const root = process.cwd();
    const profile = JSON.parse(
      await readFile(join(root, 'validation/windows/profile.json'), 'utf8')
    ) as { assets?: string[]; installation?: { assets?: string[] } };
    const asset = 'test/e2e/fixtures/installed-attachment-filename-page.html';
    assert(profile.installation?.assets?.includes(asset));
    assert(profile.assets?.includes('validation/windows/inputs'));
    const bundle = await mkdtemp(join(tmpdir(), 'xeg-filename-assets-'));
    try {
      await mkdir(join(bundle, 'test/e2e/fixtures'), { recursive: true });
      await copyFile(join(root, asset), join(bundle, asset));
      assert.match(await loadAttachmentFilenameFixtureHtml(bundle), /id="filename-b2"/u);
    } finally {
      await rm(bundle, { recursive: true, force: true });
    }
  });
  it('binds the same B1/B2 sources and owner positions in A and B responses', () => {
    const root = attachmentFilenameApiResponse('8555555555555555555').data.tweetResult.result;
    const middle = attachmentFilenameApiResponse(COMPACT_MIDDLE_ID).data.tweetResult.result;
    const quoted = root.quoted_status_result?.result;
    assert(quoted);
    assert.deepEqual(quoted, middle);
    assert.deepEqual(
      middle.legacy.extended_entities.media.map((media) => [
        media.id_str,
        media.expanded_url,
        media.media_url_https,
      ]),
      [
        [
          'filename-b2',
          `https://x.com/middle_fixture/status/${COMPACT_MIDDLE_ID}/photo/2`,
          'https://pbs.twimg.com/media/GkE9012MNOPQR.jpg?format=jpg&name=medium',
        ],
        [
          'filename-b1',
          `https://x.com/middle_fixture/status/${COMPACT_MIDDLE_ID}/photo/1`,
          'https://pbs.twimg.com/media/GkE5678GHIJKL.jpg?format=jpg&name=medium',
        ],
      ]
    );
    const inner = middle.quoted_status_result?.result;
    assert(inner && 'rest_id' in inner);
    assert.equal(inner.rest_id, COMPACT_INNER_ID);
    const innerResult = attachmentFilenameApiResponse(COMPACT_INNER_ID).data.tweetResult.result;
    assert.deepEqual(inner, innerResult);
    assert.equal(
      innerResult.legacy.extended_entities.media[0]?.media_url_https,
      'https://pbs.twimg.com/media/CompactQuoteSelected?format=webp&name=medium'
    );
  });

  it('removes only B1 from the partial DOM and preserves B2 photo/2 source binding', async () => {
    const html = await readFile(
      join(process.cwd(), 'test/e2e/fixtures/installed-attachment-filename-page.html'),
      'utf8'
    );
    const full = attachmentFilenamePageHtml(html, false);
    const partial = attachmentFilenamePageHtml(html, true);
    assert.match(full, /id="filename-b1"/u);
    assert.doesNotMatch(partial, /id="filename-b1"/u);
    assert.match(partial, /status\/9555555555555555555\/photo\/2/u);
    assert.match(partial, /id="filename-b2"/u);
    assert.match(partial, /profile_images\/2\/fixture-b\.jpg/u);
    assert.match(partial, /GkE9012MNOPQR\.jpg\?name=small/u);
  });

  it('serves an exact B1 404 then restores the admitted original bytes', async () => {
    const fixture = createExtensionNativeFixtureHandler();
    fixture.setPayloads(
      [Buffer.from('A1'), Buffer.from('B1'), Buffer.from('B2')],
      Object.fromEntries(
        ['quote-one', 'quote-two', 'linked-four', 'quote-three', 'nested-c'].map((name) => [
          name,
          Buffer.from('video'),
        ])
      )
    );
    const server = createServer(fixture.handle);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    assert(address && typeof address !== 'string');
    const read = (path: string) =>
      new Promise<{ status: number | undefined; bytes: Buffer }>((resolve, reject) => {
        const outgoing = request(
          { hostname: '127.0.0.1', port: address.port, path, headers: { Host: 'pbs.twimg.com' } },
          (incoming) => {
            const chunks: Buffer[] = [];
            incoming.on('data', (chunk: Buffer) => chunks.push(chunk));
            incoming.once('error', reject);
            incoming.once('end', () =>
              resolve({ status: incoming.statusCode, bytes: Buffer.concat(chunks) })
            );
          }
        );
        outgoing.once('error', reject);
        outgoing.end();
      });
    try {
      for (const path of ['GkE5678GHIJKL.jpg', 'GkE9012MNOPQR.jpg']) {
        const expected = `https://pbs.twimg.com/media/${path}?format=jpg&name=orig`;
        assert.equal(
          normalizeOriginalImageUrl(`https://pbs.twimg.com/media/${path}?name=small`),
          expected
        );
        fixture.armHttpFailure(expected, 404);
        assert.deepEqual(await read(new URL(expected).pathname + new URL(expected).search), {
          status: 404,
          bytes: Buffer.alloc(0),
        });
        fixture.clearHttpFailure();
        assert.equal(
          (await read(new URL(expected).pathname + new URL(expected).search)).status,
          200
        );
      }
    } finally {
      fixture.destroyActive();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
    }
  });
});
