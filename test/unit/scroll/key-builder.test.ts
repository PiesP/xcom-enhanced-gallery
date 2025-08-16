import { describe, it, expect } from 'vitest';
// RED 단계: 아직 통합 key-builder 모듈이 없으므로 import 실패 혹은 빌드 에러 예상
import { buildRouteScrollKey } from '@shared/scroll/key-builder';

describe('key-builder (route)', () => {
  it('루트 경로', () => {
    expect(buildRouteScrollKey('/')).toBe('scroll:raw:/');
  });
  it('home 타임라인', () => {
    expect(buildRouteScrollKey('/home')).toBe('scroll:timeline:home');
  });
  it('북마크', () => {
    expect(buildRouteScrollKey('/i/bookmarks')).toBe('scroll:timeline:bookmarks');
  });
  it('사용자 기본 타임라인', () => {
    expect(buildRouteScrollKey('/user123')).toBe('scroll:timeline:user:user123:main');
  });
  it('사용자 media', () => {
    expect(buildRouteScrollKey('/user123/media')).toBe('scroll:timeline:user:user123:media');
  });
  it('사용자 likes', () => {
    expect(buildRouteScrollKey('/user123/likes')).toBe('scroll:timeline:user:user123:likes');
  });
  it('기타 경로 보존', () => {
    expect(buildRouteScrollKey('/unknown/path/a')).toBe('scroll:raw:/unknown/path/a');
  });
});
