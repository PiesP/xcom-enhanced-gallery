/**
 * Twitter Video Legacy Normalizer (legacy path)
 *
 * Modern GraphQL 응답과 legacy 필드를 안전하게 병합하는 순수 함수.
 * - 기존 현대 필드가 존재하면 유지(legacy로 덮어쓰지 않음)
 * - 여러 번 호출해도 같은 결과(idempotent)
 */

export interface TweetLike {
  legacy?: {
    extended_entities?: { media?: unknown[] } | undefined;
    full_text?: string | undefined;
    id_str?: string | undefined;
  };
  extended_entities?: { media?: unknown[] } | undefined;
  full_text?: string | undefined;
  id_str?: string | undefined;
}

export interface UserLike {
  legacy?: {
    screen_name?: string | undefined;
    name?: string | undefined;
  };
  screen_name?: string | undefined;
  name?: string | undefined;
}

/**
 * Tweet 객체에 legacy 필드를 현대 구조로 병합
 */
export function normalizeTweetLegacy<T extends TweetLike>(tweet: T): T {
  const legacy = tweet.legacy;
  if (!legacy) return tweet;

  if (!tweet.extended_entities && legacy.extended_entities) {
    tweet.extended_entities = legacy.extended_entities;
  }

  if (!tweet.full_text && legacy.full_text) {
    tweet.full_text = legacy.full_text;
  }

  if (!tweet.id_str && legacy.id_str) {
    tweet.id_str = legacy.id_str;
  }

  return tweet;
}

/**
 * User 객체에 legacy 필드를 현대 구조로 병합
 */
export function normalizeUserLegacy<U extends UserLike>(user: U): U {
  const legacy = user.legacy;
  if (!legacy) return user;

  if (!user.screen_name && legacy.screen_name) {
    user.screen_name = legacy.screen_name;
  }

  if (!user.name && legacy.name) {
    user.name = legacy.name;
  }

  return user;
}
