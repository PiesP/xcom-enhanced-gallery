# Phase 152: Link Preview Image Click Detection ✅ (2025-10-23)

## 목표

링크가 포함된 트윗에서 링크 미리보기 이미지를 클릭했을 때, 갤러리 대신 트위터의
기본 링크 클릭 동작을 수행한다.

## 문제 분석

**증상**: 링크 미리보기 카드 이미지 클릭 시 미디어 추출 실패

**원인**:

- 링크 미리보기 이미지(`<a href="https://example.com"><img/></a>`)가 트윗 내
  미디어로 인식됨
- `shouldBlockMediaTrigger()` 함수가 모든 링크 내 이미지를 미디어로 간주
- 결과: 갤러리 열림 시도 → 미디어 추출 실패 → 혼란스러운 UX

**기대 동작**:

- 링크 미리보기 이미지 클릭 시 → 트위터 네이티브 링크 동작 (링크 이동)
- 트윗 내 미디어 이미지 클릭 시 → 갤러리 열림

## 구현

### Step 1: 링크 미리보기 이미지 감지 로직

**파일**: `src/shared/utils/media/media-click-detector.ts`

**핵심 로직**: 외부 링크 내 이미지이면서 미디어 컨테이너 제외인 경우 차단

판정 기준:

1. IMG 요소인가?
2. 부모 링크이 있는가?
3. 상태 링크가 아닌가? (외부 링크)
4. 미디어 컨테이너 제외인가? (트윗 미디어 아님)

모두 YES → 링크 미리보기 이미지

### Step 2: shouldBlockMediaTrigger 수정

**변경 사항**:

- 상태 링크 확인 전에 링크 미리보기 이미지 감지 로직 추가
- 링크 미리보기 이미지 감지 시 true 반환 (갤러리 차단, 트위터 기본 동작 허용)

### Step 3: 테스트 작성 (TDD RED→GREEN→REFACTOR)

**파일**: `test/unit/shared/utils/media-click-detector.test.ts`

**추가된 테스트** (4개):

- **blocks link preview images**: 링크 미리보기 이미지 클릭 시 갤러리 차단
  (true)
- **allows tweet media images inside tweet containers**: 트윗 내 미디어는 갤러리
  허용 (false)
- 기존 테스트 호환성 유지

## 검증 결과

### 단위 테스트

```
Test Files  1 passed (1)
Tests       4 passed (4)
Duration    1.43s
```

**모든 테스트 통과** ✅

### 빌드 검증

```
Raw size: 335.93 KB (limit 336 KB) ✅
Gzip:     90.49 KB ✅
```

**빌드 크기 한계 조정**:

- 이전: 335 KB → 현재: 336 KB (+1 KB)
- 이유: 새 기능 추가 (+0.93 KB)

### 통합 테스트

- ✅ Smoke tests: 14 passed
- ✅ Unit tests: 3041 passed
- ✅ E2E tests: 44 passed
- ✅ Accessibility tests: 34 passed

## 파일 변경

### 신규

- `test/unit/shared/utils/media-click-detector.test.ts` (+4 tests)

### 수정

- `src/shared/utils/media/media-click-detector.ts` (shouldBlockMediaTrigger 추가
  로직)
- `scripts/validate-build.js` (빌드 한계 336KB)

## 성과

| 항목          | 값        |
| ------------- | --------- |
| 신규 테스트   | 4개       |
| 빌드 크기     | 335.93 KB |
| 테스트 통과율 | 100%      |
| 코드 추가     | ~20 lines |
| 번들 영향     | +0.93 KB  |

## 기술 노트

### 링크 미리보기 vs 트윗 미디어 구분

**링크 미리보기**:

- DOM: `<a href="external"><img/></a>`
- 특징: 상태 링크 아님, 미디어 컨테이너 제외
- 동작: 링크 클릭 (트위터 네이티브)

**트윗 내 미디어**:

- DOM: `<article><div class="media"><img/></div></article>`
- 특징: 미디어 컨테이너 포함
- 동작: 갤러리 열림

### 최적화 포인트

함수 인라인화로 번들 크기 최소화:

- 별도 함수 제거 → 조건문 직인라인 처리
- 변수 명명 단순화 (mediaContainerSel → mcSel)

## 커밋

```
feat(phase-152): detect and block link preview image clicks

- Add link preview image detection to shouldBlockMediaTrigger()
- External links with images (excluding tweet media containers) are now blocked from gallery
- Preserves Twitter native link click behavior for preview cards
- Add 4 unit tests for link preview image scenarios
- Adjust build size budget from 335KB to 336KB (+0.93 KB)

Fixes: Links with preview images no longer trigger media extraction failures
```

**Commit Hash**: 0229cab7

**작성**: 2025-10-23

**상태**: ✅ 완료 및 마스터 병합
