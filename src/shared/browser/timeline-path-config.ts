/**
 * @fileoverview Twitter 타임라인 경로 패턴 상수 및 매칭 유틸
 */

export const HOME_TIMELINE_PATHS: readonly string[] = ['/', '/home'] as const;

// 사용자 핸들 제약 설정 (추후 단일 소스에서 조정 가능)
export const USER_HANDLE_ALLOWED_CHARS = 'A-Za-z0-9_';
export const USER_HANDLE_MIN_LENGTH = 1;
export const USER_HANDLE_MAX_LENGTH = 30;

// 정적 정규식 (성능 위해 사전 계산)
export const USER_TIMELINE_REGEX: RegExp = new RegExp(
  `^/[${USER_HANDLE_ALLOWED_CHARS}]{${USER_HANDLE_MIN_LENGTH},${USER_HANDLE_MAX_LENGTH}}$`
);

export interface TimelinePathMatchResult {
  isHome: boolean;
  isUser: boolean;
  isTimeline: boolean;
}

export function matchTimelinePath(pathname: string): TimelinePathMatchResult {
  const isHome = HOME_TIMELINE_PATHS.includes(pathname);
  const isUser = !isHome && USER_TIMELINE_REGEX.test(pathname);
  return { isHome, isUser, isTimeline: isHome || isUser };
}
