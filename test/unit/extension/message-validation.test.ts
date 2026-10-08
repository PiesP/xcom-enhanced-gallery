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

  it('accepts cancellation messages with a bounded request id', () => {
    expect(
      isValidIncomingMessage({
        type: 'DOWNLOAD_CANCEL_REQUEST',
        payload: { requestId: 'download-request-1' },
      })
    ).toBe(true);
    expect(
      isValidIncomingMessage({
        type: 'DOWNLOAD_CANCEL_REQUEST',
        payload: { requestId: '' },
      })
    ).toBe(false);
  });

  it('allows blob status queries only for bounded IDs and page-owned URLs', () => {
    const query = (requestId: string, objectUrl: string) => ({
      type: 'DOWNLOAD_BLOB_STATUS_REQUEST',
      payload: { requestId, objectUrl },
    });
    expect(isValidIncomingMessage(query('request-1', 'blob:https://x.com/resource'))).toBe(true);
    expect(isValidIncomingMessage(query('', 'blob:https://x.com/resource'))).toBe(false);
    expect(isValidIncomingMessage(query('request-1', 'blob:https://attacker.example/resource'))).toBe(false);
    expect(isValidIncomingMessage(query('request-1', 'https://x.com/resource'))).toBe(false);
    expect(isValidIncomingMessage({
      type: 'DOWNLOAD_BLOB_STATUS_REQUEST',
      payload: {
        requestId: 'request-1',
        objectUrl: 'blob:https://x.com/resource',
        cancelRequested: 'yes',
      },
    })).toBe(false);
  });
});
