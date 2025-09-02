# MediaExtractionCache 사용 가이드

Phase 11 에서 MediaExtractionService 는 tweetId 기반 LRU + TTL 캐시를
도입했습니다. API 재시도(최대 1회) 후 성공 결과 또는 DOM 폴백 성공 결과를 캐시에
저장하여 동일 트윗 반복 클릭 시 성능을 향상합니다.

## 기본 동작

- 키: `tweetId`
- 정책: LRU (가장 오래 안쓴 항목 제거) + TTL 만료 시 항목 무효 처리
- 기본값:
  - `maxEntries`: 100
  - `ttlMs`: 120000 (2분)
- `get()` 시 만료된 항목은 즉시 제거되며 `undefined` 반환
- `get()` 성공 시 LRU 순서를 최신으로 갱신 (재삽입)

## 생성자 옵션

```ts
interface MediaExtractionCacheOptions {
  maxEntries?: number; // 기본 100
  ttlMs?: number; // 기본 120000 (2분)
}
```

## 주입(Injection)

`MediaExtractionService` 는 선택적 생성자 인자로 커스텀 캐시를 받을 수 있습니다.

```ts
import { MediaExtractionService } from '@shared/services/media-extraction/MediaExtractionService';
import { MediaExtractionCache } from '@shared/services/media-extraction/MediaExtractionCache';

const cache = new MediaExtractionCache({ maxEntries: 300, ttlMs: 60_000 });
const service = new MediaExtractionService(cache);
```

주입하지 않으면 기본 옵션(100 / 120000ms)으로 내부 인스턴스가 생성됩니다.

## 메타데이터 필드

추출 결과(`MediaExtractionResult.metadata`)에 다음 필드가 포함됩니다:

- `attempts`: API 호출 시도 총 횟수 (초기 1 + 재시도 1 → 최대 2)
- `retries`: 재시도 횟수 (0 또는 1)
- `cacheHit`: 캐시 적중 여부
- `sourceType`: 'api-first' | 'dom-fallback' | 'dom-direct-failed' |
  'extraction-failed' | 'cache' 등

## 캐시 저장 조건

- API 경로 성공: `sourceType = 'api-first'`
- API 모두 실패 후 DOM 폴백 성공: `sourceType = 'dom-fallback'`
- tweetId 없거나 DOM 직접 추출(초기 tweetInfo 실패) 성공 시: tweetId 키가
  없으므로 캐시 저장 불가 (설계상 제외)

## 테스트 전략 (TDD 참고)

1. 재시도 후 API 성공 → 캐시 미적중 첫 호출 / 두번째 호출 cacheHit=true
2. API 2회 실패 + DOM 폴백 성공 → attempts=2, retries=1, cacheHit=false,
   sourceType='dom-fallback'
3. 캐시 LRU/TTL 단위 테스트 → TTL 만료, LRU 초과 제거, 접근 후 갱신

## 주의사항

- TTL 이 짧을수록 API 호출 빈도 증가 → 성능/최신성 트레이드오프
- 너무 큰 maxEntries 는 메모리 점유 증가
- tweetId 없는 초기 DOM-only 경로는 캐시 키 부재로 제외 (필요시 별도 키 전략
  도입 고려)

## 추후 확장 아이디어

- 캐시 적중 통계 수집 및 노출
- tweetId + media hash 조합 키로 DRM 회피 / 변형 대비
- 다양한 재시도 backoff 전략 (exponential, jitter)
