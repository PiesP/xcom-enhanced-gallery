/**
 * MSW Test Example - HTTP Request Service
 *
 * Demonstrates testing network error scenarios using MSW.
 */

import { server } from '@test/msw/server';
import { errorHandlers, createCustomHandler, API_BASE_URLS } from '@test/msw/handlers';

describe('MSW Integration Example', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('should handle successful response', async () => {
    const response = await fetch(`${API_BASE_URLS.twitter}/2/tweets/123`);
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.data.id).toBe('1234567890');
  });

  it('should handle 404 error', async () => {
    server.use(errorHandlers.notFound);

    const response = await fetch('https://example.com/not-found');

    expect(response.status).toBe(404);
  });

  it('should handle 500 server error', async () => {
    server.use(errorHandlers.serverError);

    const response = await fetch('https://example.com/error');

    expect(response.status).toBe(500);
  });

  it('should handle rate limiting', async () => {
    server.use(errorHandlers.rateLimit);

    const response = await fetch('https://example.com/limited');

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
  });

  it('should handle custom response', async () => {
    const customHandler = createCustomHandler(
      'https://example.com/custom',
      { custom: 'data' },
      { delay: 100, status: 201 },
    );
    server.use(customHandler);

    const start = Date.now();
    const response = await fetch('https://example.com/custom');
    const elapsed = Date.now() - start;
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.custom).toBe('data');
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });

  it('should handle image download', async () => {
    const response = await fetch(`${API_BASE_URLS.twitterMedia}/media/test.png`);

    expect(response.ok).toBe(true);
    expect(response.headers.get('Content-Type')).toBe('image/png');

    const buffer = await response.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(0);
  });

  it('should handle video streaming', async () => {
    const response = await fetch(`${API_BASE_URLS.video}/ext_tw_video/test.mp4`);

    expect(response.ok).toBe(true);
    expect(response.headers.get('Content-Type')).toBe('video/mp4');

    const buffer = await response.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(0);
  });
});
