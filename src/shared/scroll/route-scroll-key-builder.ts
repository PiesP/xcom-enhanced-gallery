/**
 * Route Scroll Key Builder
 * - 타임라인 유형/사용자/미디어/북마크 등을 구분하여 충돌 없는 스크롤 저장 키 생성
 */
export function buildRouteScrollKey(pathname: string): string {
  try {
    if (!pathname || pathname === '/') return 'scroll:raw:/';

    // 정규화: 해시/쿼리 제거 (이미 pathname 이라면 필요 없음)
    const path = pathname;

    // 공용 패턴
    if (path === '/home') return 'scroll:timeline:home';
    if (path === '/i/bookmarks') return 'scroll:timeline:bookmarks';

    // 사용자 타임라인 패턴: /:user(/media|/with_replies|/likes)?
    // username 은 @ 포함 안된 경로 segment 가정 (Twitter/X 구조)
    const userTimelineMatch = path.match(/^\/([^/]+)(?:\/(media|with_replies|likes))?$/);
    if (userTimelineMatch) {
      const [, username, sub] = userTimelineMatch;
      const base = `scroll:timeline:user:${username}`;
      if (!sub) return `${base}:main`;
      switch (sub) {
        case 'media':
          return `${base}:media`;
        case 'with_replies':
          return `${base}:replies`;
        case 'likes':
          return `${base}:likes`;
        default:
          return `${base}:${sub}`; // fallback
      }
    }

    // 기타 경로: 원본 보존 (충돌 최소화)
    return `scroll:raw:${path}`;
  } catch {
    return 'scroll:raw:unknown';
  }
}
