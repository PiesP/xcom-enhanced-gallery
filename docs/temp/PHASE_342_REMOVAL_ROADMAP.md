# Phase 342: 기존 구현 제거 경로 (향후 Phase)

**작성 일자**: 2025-11-04
**상태**: 🔮 향후 Phase 계획 (Phase 343+)
**목표**: 최적화 후 중복/불필요 코드 정리 경로 제시

---

## 현재 구조 (Phase 342 완료 후)

```
src/shared/services/
├── media-extraction/
│   ├── strategies/
│   │   ├── dom-structure-tweet-strategy.ts        (fallback)
│   │   ├── clicked-element-tweet-strategy.ts      (fallback)
│   │   └── quote-tweet-detector.ts                ✨ 신규 (Phase 342)
│   └── extractors/
│       └── dom-direct-extractor.ts               (개선됨)
└── media/
    └── twitter-video-extractor.ts                (개선됨)
```

---

## 제거 가능 코드 분석

### 1️⃣ `clicked-element-tweet-strategy.ts` (조건부 제거 가능)

**파일**: `src/shared/services/media-extraction/strategies/clicked-element-tweet-strategy.ts`

**현재 역할**:
- 클릭된 요소로부터 트윗 컨테이너 찾기
- DOM 구조 분석
- 선택적 전략 (fallback)

**제거 가능 조건** (모두 충족):
- [ ] Phase 342.5 테스트 >95% 통과
- [ ] QuoteTweetDetector가 이 로직을 완전히 대체
- [ ] 사용 통계: 0% 사용률 (로그 기준)
- [ ] 다른 곳에서 import하지 않음

**제거 영향도**:
```
영향 받는 파일: 0개
이유: 현재 미사용 상태 (선택적 전략)
```

**권장 제거 시기**: Phase 343 (안정화 후)

**제거 절차**:
```bash
# 1. 사용 확인
grep -r "clicked-element-tweet-strategy" src/

# 2. 테스트 실행
npm run test:unit -- clicked-element

# 3. 파일 삭제
rm src/shared/services/media-extraction/strategies/clicked-element-tweet-strategy.ts

# 4. 전략 레지스트리 업데이트
# (만약 레지스트리가 있다면)
```

---

### 2️⃣ `dom-structure-tweet-strategy.ts` (조건부 제거 가능)

**파일**: `src/shared/services/media-extraction/strategies/dom-structure-tweet-strategy.ts`

**현재 역할**:
- DOM 구조 기반 트윗 컨테이너 찾기
- 기본 전략

**제거 가능 조건** (모두 충족):
- [ ] Phase 342.5 테스트 >95% 통과
- [ ] QuoteTweetDetector + DOMDirectExtractor가 이 로직 완전 대체
- [ ] 사용 통계: 0% 사용률 (로그 기준)
- [ ] 다른 곳에서 import하지 않음

**사용 현황 확인**:
```bash
grep -r "dom-structure-tweet-strategy" src/
```

**제거 영향도**:
```
영향 받는 파일: 1개 (strategies/index.ts)
영향도: 낮음 (barrel export만 영향)
```

**권장 제거 시기**: Phase 343+ (충분한 테스트 후)

**제거 절차**:
```bash
# 1. 사용 확인
grep -r "DomStructureTweetStrategy\|dom-structure" src/

# 2. strategies/index.ts 업데이트
# before:
export { DomStructureTweetStrategy } from './dom-structure-tweet-strategy';

# after:
// [DEPRECATED Phase 343] Removed in favor of QuoteTweetDetector

# 3. 파일 삭제
rm src/shared/services/media-extraction/strategies/dom-structure-tweet-strategy.ts
```

---

### 3️⃣ `closest()` 로직 in DOMDirectExtractor (유지 필수)

**파일**: `src/shared/services/media-extraction/extractors/dom-direct-extractor.ts`

**현재 코드** (Lines 169-172):
```typescript
// 2. 일반 트윗 처리 (기존 로직)
const closestTweet = this.selectors.findClosest(
  STABLE_SELECTORS.TWEET_CONTAINERS,
  element
);
if (closestTweet) return closestTweet as HTMLElement;
```

**제거 가능 여부**: ❌ **NO - 반드시 유지**

**이유**:
- ✅ Quote tweet이 아닌 경우의 fallback
- ✅ QuoteTweetDetector 실패 시 안전장치
- ✅ 성능 최적화 (간단한 검사 우선)

**유지 계획**:
```typescript
// Phase 342 후 유지:
const quoteTweetStructure =
  QuoteTweetDetector.analyzeQuoteTweetStructure(element);

if (quoteTweetStructure.isQuoteTweet &&
    quoteTweetStructure.targetArticle) {
  return quoteTweetStructure.targetArticle;  // 복잡한 경우
}

// Fallback: 단순 케이스
const closestTweet = this.selectors.findClosest(
  STABLE_SELECTORS.TWEET_CONTAINERS,
  element
);
if (closestTweet) return closestTweet as HTMLElement;  // 유지!
```

---

## 제거 불가 코드 (유지 필수)

### 1️⃣ TwitterAPI의 quote tweet 처리

**파일**: `src/shared/services/media/twitter-video-extractor.ts` (Lines 379-428)

**이유**:
- ✅ API 응답에서 quoted_status_result 처리
- ✅ 인용 트윗의 미디어 추출
- ✅ 인덱스 조정 로직
- ❌ DOM과 무관 (독립적 로직)

**유지 방침**:
- Phase 342 이후로도 계속 필요
- 개선만 진행 (제거 X)

---

### 2️⃣ 타입 시스템

**파일**:
- `src/shared/types/media.types.ts`
- `src/shared/services/media/types.ts`

**이유**:
- ✅ 신규 필드는 optional만
- ✅ 기존 필드 변경 없음
- ✅ 확장성 우수

**유지 방침**:
- 제거 절대 금지
- 추가만 진행

---

## 최적화 로드맵

### Phase 342 (현재) ✅
- [x] QuoteTweetDetector 구현
- [x] DOMDirectExtractor 통합
- [x] TwitterAPI 개선
- [ ] 통합 테스트

### Phase 342.5 🔄
- [ ] >95% 테스트 통과 확인
- [ ] 성능 프로파일링
- [ ] 메모리 사용량 분석
- [ ] 로그 분석 (사용 통계)

### Phase 343 (최적화)
- [ ] 사용 통계 기반 평가
- [ ] `clicked-element-tweet-strategy.ts` 제거 검토
- [ ] `dom-structure-tweet-strategy.ts` 제거 검토
- [ ] 성능 개선

### Phase 344+ (정리)
- [ ] deprecated 코드 완전 제거
- [ ] 문서 업데이트
- [ ] v0.5.0 릴리스 준비

---

## 제거 체크리스트 (Phase 343+)

### `clicked-element-tweet-strategy.ts` 제거

- [ ] `npm run typecheck` 통과
- [ ] `npm run lint` 통과
- [ ] `npm run test` 모두 통과
- [ ] 사용 통계 확인: 0% 사용
- [ ] 코드 리뷰 승인
- [ ] 변경 로그 작성
- [ ] 커밋 메시지: `refactor(Phase 343): Remove unused clicked-element-tweet-strategy`

### `dom-structure-tweet-strategy.ts` 제거

- [ ] `npm run typecheck` 통과
- [ ] `npm run lint` 통과
- [ ] `npm run test` 모두 통과
- [ ] 사용 통계 확인: 0% 사용
- [ ] 코드 리뷰 승인
- [ ] strategies/index.ts 업데이트
- [ ] 변경 로그 작성
- [ ] 커밋 메시지: `refactor(Phase 343): Remove unused dom-structure-tweet-strategy`

---

## 예상 코드 감소

### 제거 전 (Phase 342)
```
src/shared/services/media-extraction/strategies/
├── dom-structure-tweet-strategy.ts        (~80줄)
├── clicked-element-tweet-strategy.ts      (~150줄)
├── quote-tweet-detector.ts                (331줄) ✨ 신규
└── index.ts                               (~10줄)

합계: ~571줄
```

### 제거 후 (Phase 343)
```
src/shared/services/media-extraction/strategies/
├── quote-tweet-detector.ts                (331줄)
└── index.ts                               (~3줄)

합계: ~334줄

감소: -237줄 (-42%)
```

---

## 커밋 예시 (Phase 343)

### Commit 1: First strategy removal
```
refactor(Phase 343): Remove unused clicked-element-tweet-strategy

- QuoteTweetDetector (Phase 342) completely supersedes this strategy
- Test coverage: 95%+, zero usage in production logs
- Performance: No measurable impact

BREAKING CHANGE: Internal API change (strategy removal)
Phase: 343
Commit-Type: refactor
```

### Commit 2: Second strategy removal
```
refactor(Phase 343): Remove unused dom-structure-tweet-strategy

- QuoteTweetDetector + DOMDirectExtractor (Phase 342) supersedes
- Fallback logic moved to DOMDirectExtractor
- Test coverage: 95%+, zero usage in production logs

BREAKING CHANGE: Internal API change (strategy removal)
Phase: 343
Commit-Type: refactor
```

---

## 위험도 평가

| 단계 | 제거 대상 | 위험도 | 이유 |
|------|---------|--------|------|
| 현재 | 없음 | 🟢 낮음 | Phase 342 구현 완료, 테스트 필요 |
| Phase 343 | clicked-element | 🟡 중간 | 확인 후 제거 권장 |
| Phase 343 | dom-structure | 🟡 중간 | 확인 후 제거 권장 |
| 향후 | 유지 코드 | 🟢 낮음 | 제거 금지 |

---

## 결론

### 현재 (Phase 342) ✅
- **제거 가능 코드**: 없음 (모두 필요)
- **테스트 진행**: 안전
- **상태**: 호환성 100%

### 단기 (Phase 343) ⚠️
- **제거 권장**: 2개 strategy 파일
- **시기**: 테스트 통과 후
- **영향도**: 낮음

### 장기 (Phase 344+) 🔮
- **정리**: deprecated 코드 완전 제거
- **최적화**: 성능 개선
- **안정화**: v0.5.0 준비

---

**다음 단계**: Phase 342.5 통합 테스트 진행
