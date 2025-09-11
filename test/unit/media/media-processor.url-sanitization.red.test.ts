/**
 * @file RED: MediaProcessor URL Sanitization / Whitelist Policy 테스트
 * 목표 (Phase 8): 허용된 프로토콜/스킴 + 안전한 도메인 / data:/blob: 정책 적용
 * - 허용: https/http 상대경로(/...) data: (이미지 MIME 한정) blob: (브라우저 생성)
 * - 차단/필터링: javascript:, vbscript:, file:, ftp:, chrome-extension:, about:blank (직접 미디어 제외)
 * - twitter CDN (pbs.twimg.com/media) 이미지의 name=orig 강제는 기존 정책 유지
 * 기대 결과 (GREEN 전): sanitize 단계 도입 후 unsafe URL 제거 또는 Result.error
 */
/// <reference lib="dom" />
import { describe, it, expect } from 'vitest';
// jsdom 환경 전역 선언 (RED 테스트 간결화를 위해 any 사용)
declare const document: any;

describe('MediaProcessor URL Sanitization (RED)', () => {
  it('허용되지 않은 스킴(javascript:, data:text/html 등)은 필터링하거나 실패 처리해야 한다', async () => {
    const { MediaProcessor } = await import('@shared/media/MediaProcessor');
    const root = document.createElement('div');

    const imgSafe = document.createElement('img');
    imgSafe.src = 'https://pbs.twimg.com/media/abc123?format=jpg&name=large';
    root.appendChild(imgSafe);

    const imgJs = document.createElement('img');
    imgJs.src = 'javascript:alert(1)';
    root.appendChild(imgJs);

    const imgDataUnsafe = document.createElement('img');
    imgDataUnsafe.src = 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==';
    root.appendChild(imgDataUnsafe);

    const imgDataImage = document.createElement('img');
    imgDataImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
    root.appendChild(imgDataImage);

    const imgBlob = document.createElement('img');
    imgBlob.src = 'blob:https://example.com/550e8400-e29b-41d4-a716-446655440000';
    root.appendChild(imgBlob);

    const processor = new MediaProcessor();
    const result: any = processor.process(root, { telemetry: false } as any);
    expect(result.success).toBe(true);

    const urls = result.data.map((d: any) => d.url);
    // RED 단계: 아직 sanitize 미구현이므로 javascript:/data:text/html 이 그대로 남아 FAIL 유도
    expect(urls).not.toContain('javascript:alert(1)');
    expect(urls).not.toContain('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==');
    // 허용된 data:image, blob: 은 유지
    expect(urls).toContain('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA');
    expect(urls).toContain('blob:https://example.com/550e8400-e29b-41d4-a716-446655440000');
  });
});
