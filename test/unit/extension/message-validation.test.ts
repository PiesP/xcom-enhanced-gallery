import { describe, expect, it } from 'vitest';

import { isValidIncomingMessage } from '../../../src/extension/message-validation';

describe('extension message validation', () => {
  it('accepts a whitelisted URL download message', () => {
    expect(
      isValidIncomingMessage({
        type: 'DOWNLOAD_REQUEST',
        payload: {
          url: 'https://pbs.twimg.com/media/example.jpg?format=jpg&name=orig',
          filename: 'example.jpg',
        },
      })
    ).toBe(true);
  });

  it('rejects a download message with an unsafe filename', () => {
    expect(
      isValidIncomingMessage({
        type: 'DOWNLOAD_REQUEST',
        payload: {
          url: 'https://pbs.twimg.com/media/example.jpg',
          filename: '../outside.txt',
        },
      })
    ).toBe(false);
  });

  it('accepts only page-owned blob URLs for blob downloads', () => {
    expect(
      isValidIncomingMessage({
        type: 'DOWNLOAD_BLOB_URL_REQUEST',
        payload: {
          objectUrl: 'blob:https://x.com/6f8f8f2f-5f7f-4b9e-9f9a-1f2d9d8c5f3a',
          filename: 'example.jpg',
        },
      })
    ).toBe(true);
    expect(
      isValidIncomingMessage({
        type: 'DOWNLOAD_BLOB_URL_REQUEST',
        payload: {
          objectUrl: 'https://attacker.example/download',
          filename: 'example.jpg',
        },
      })
    ).toBe(false);
  });

  it('rejects notification payloads with untrusted image URLs', () => {
    expect(
      isValidIncomingMessage({
        type: 'SHOW_NOTIFICATION',
        payload: {
          id: 'notification-1',
          title: 'Title',
          message: 'Message',
          imageUrl: 'https://attacker.example/icon.png',
        },
      })
    ).toBe(false);
  });
});
