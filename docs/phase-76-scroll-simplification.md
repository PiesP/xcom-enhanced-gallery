# Phase 76: 스크롤 로직 단순화

> **목표**: 커스텀 스크롤 로직 제거, 브라우저 네이티브 스크롤 전면 도입
> **기간**: 2-3일 (TDD 접근) **재시작 조건 충족**: Phase 78 완료 ✅ + 테스트
> 통과율 99.6% ✅

---

## 1. 현재 상황 분석

### 1.1 현재 스크롤 로직 구조

**3개 계층의 스크롤 처리**:

1. **useGalleryScroll** (`src/features/gallery/hooks/useGalleryScroll.ts`)
   - 휠 이벤트 감지 및 델타 계산
   - 트위터 페이지 스크롤 차단 (`preventTwitterScroll`)
   - 스크롤 방향 추적 (`scrollDirection`)
   - 스크롤 상태 관리 (`isScrolling`, `lastScrollTime`)

2. **useGalleryItemScroll**
   (`src/features/gallery/hooks/useGalleryItemScroll.ts`)
   - `scrollIntoView` 기반 아이템 간 이동
   - 사용자 스크롤 vs 자동 스크롤 구분
   - 디바운스 로직
   - Reduced motion 지원

3. **VerticalGalleryView**
   (`src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`)
   - `scrollBy` 기반 수동 스크롤 구현
   - 경계 조건 처리 (clamping)
   - `onScroll` 콜백에서 직접 `scrollBy` 호출

### 1.2 현재 문제점

1. **과도한 커스텀 로직**: 브라우저가 이미 제공하는 기능을 재구현
2. **복잡한 상호작용**: 3개 계층이 서로 의존하며 스크롤 상태 공유
3. **성능 오버헤드**: 불필요한 이벤트 핸들러, 타이머, 플래그
4. **유지보수 부담**: 200+ 줄의 스크롤 관련 코드 (useGalleryScroll 138줄,
   useGalleryItemScroll 315줄)
5. **테스트 복잡도**: scrollBy 모킹, 상태 동기화 등 테스트 설정 복잡

---

## 2. Phase 76 목표

### 2.1 핵심 목표

✅ **제거 대상**:

- `scrollBy` 수동 호출 로직 (VerticalGalleryView)
- 커스텀 경계 조건 처리 (clamping)
- 불필요한 스크롤 상태 추적

✅ **유지 대상**:

- `scrollIntoView` 기반 아이템 이동 (useGalleryItemScroll)
- 트위터 페이지 스크롤 차단 (useGalleryScroll)
- PC 전용 이벤트 정책

✅ **단순화 방향**:

- 브라우저 네이티브 스크롤 동작 활용
- CSS `overflow: auto` 기본 동작 신뢰
- 이벤트 핸들러 최소화

### 2.2 달성 메트릭

| 항목                 | 현재      | 목표                  | 측정 방법         |
| -------------------- | --------- | --------------------- | ----------------- |
| 스크롤 로직 줄 수    | ~450줄    | ~200줄 (-55%)         | LOC 카운트        |
| 커스텀 scrollBy 호출 | 1개       | 0개                   | grep 검색         |
| 스크롤 관련 타이머   | 4개       | 2개 (-50%)            | timer count       |
| 테스트 통과율        | 99.6%     | 99.6% 이상 (유지)     | npm test          |
| 빌드 크기            | 321.40 KB | 320 KB 이하 (-1.4 KB) | validate-build.js |

---

## 3. 구현 계획 (TDD)

### Step 1: 실패하는 테스트 작성 (RED)

**파일**: `test/unit/features/scroll-behavior-native.test.tsx`

```typescript
describe('Phase 76: Native Browser Scroll', () => {
  it('should NOT call scrollBy manually in VerticalGalleryView', () => {
    // VerticalGalleryView 소스 코드 검증
    // scrollBy 수동 호출이 없어야 함
  });

  it('should rely on CSS overflow:auto for scrolling', () => {
    // CSS 스타일 검증
    // overflow-y: auto가 적용되어야 함
  });

  it('should handle scroll events passively', () => {
    // passive: true로 이벤트 리스너 등록
  });
});
```

### Step 2: 최소 구현 (GREEN)

#### 2.1 VerticalGalleryView 수정

**Before**:

```typescript
const handleGalleryWheel = useGalleryScroll({
  onScroll: (delta, target) => {
    // 수동 scrollBy 호출
    target.scrollBy({ top: delta, behavior: 'smooth' });
  },
});
```

**After**:

```typescript
const handleGalleryWheel = useGalleryScroll({
  onScroll: (delta, target) => {
    // 브라우저 네이티브 스크롤에 위임
    // scrollBy 제거 - CSS overflow:auto로 자동 처리
  },
});
```

#### 2.2 useGalleryScroll 단순화

**제거**:

- `scrollBy` 호출 로직
- 경계 조건 계산 (clamping)
- 불필요한 로그 (delta, scrollDelta 등)

**유지**:

- 휠 이벤트 감지
- 트위터 스크롤 차단
- `passive: true` 이벤트 리스너

#### 2.3 CSS 스타일 확인

```css
/* VerticalGalleryView.module.css */
.itemsContainer {
  overflow-y: auto; /* 브라우저 네이티브 스크롤 활성화 */
  scroll-behavior: smooth; /* 부드러운 스크롤 */
}
```

### Step 3: 리팩토링

1. **코드 정리**:
   - 사용하지 않는 변수 제거
   - 중복 로직 제거
   - 함수 단순화

2. **테스트 업데이트**:
   - `scrollBy` 모킹 제거
   - 네이티브 스크롤 동작 검증으로 대체

3. **문서 업데이트**:
   - JSDoc 주석 갱신
   - README 변경사항 기록

---

## 4. 위험 요소 및 대응

### 4.1 위험 요소

1. **회귀 위험**: 기존 스크롤 동작 변경으로 인한 UX 저하
2. **트위터 스크롤 충돌**: 네이티브 스크롤로 전환 시 트위터 페이지와 충돌 가능
3. **성능 저하**: 브라우저 네이티브 스크롤이 느릴 수 있음

### 4.2 대응 방안

1. **점진적 변경**:
   - VerticalGalleryView → useGalleryScroll 순서로 단계적 제거
   - 각 단계마다 테스트 통과 확인

2. **E2E 테스트**:
   - Playwright 스모크 테스트로 실제 브라우저에서 검증
   - gallery-app.spec.ts 활용

3. **롤백 계획**:
   - Git 브랜치 유지 (`feature/phase-76-scroll-simplification`)
   - 문제 발견 시 즉시 revert 가능

---

## 5. 검증 기준

### 5.1 기능 검증

- [ ] 휠 스크롤 정상 동작
- [ ] Prev/Next 버튼 아이템 이동
- [ ] 키보드 네비게이션 (Arrow Up/Down)
- [ ] 트위터 페이지 스크롤 차단
- [ ] Reduced motion 준수

### 5.2 품질 검증

- [ ] 테스트 통과율 99.6% 이상
- [ ] 빌드 크기 320 KB 이하
- [ ] 타입 체크 0 errors
- [ ] 린트 0 warnings
- [ ] E2E 스모크 테스트 통과

### 5.3 성능 검증

- [ ] 스크롤 부드러움 (60fps 유지)
- [ ] 메모리 사용량 변화 없음
- [ ] CPU 사용량 감소 (타이머 제거 효과)

---

## 6. 타임라인

| 단계     | 작업                     | 예상 시간          | 상태 |
| -------- | ------------------------ | ------------------ | ---- |
| 1        | 계획 문서 작성           | 1시간              | ✅   |
| 2        | 실패 테스트 작성 (RED)   | 2시간              | ⏳   |
| 3        | VerticalGalleryView 수정 | 3시간              | ⏳   |
| 4        | useGalleryScroll 단순화  | 2시간              | ⏳   |
| 5        | 리팩토링                 | 2시간              | ⏳   |
| 6        | E2E 테스트               | 1시간              | ⏳   |
| 7        | 문서 업데이트 & 커밋     | 1시간              | ⏳   |
| **합계** |                          | **12시간** (1.5일) |      |

---

## 7. 참고 자료

### 7.1 관련 파일

- `src/features/gallery/hooks/useGalleryScroll.ts` (138줄)
- `src/features/gallery/hooks/useGalleryItemScroll.ts` (315줄)
- `src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`
  (스크롤 관련 100줄)
- `test/unit/features/scroll-behavior.test.ts` (기존 RED 테스트)
- `test/unit/hooks/use-gallery-scroll.test.ts`

### 7.2 브라우저 네이티브 스크롤 API

- [MDN: Element.scrollBy()](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollBy)
- [MDN: Element.scrollIntoView()](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView)
- [MDN: CSS scroll-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior)
- [MDN: Passive Event Listeners](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#passive)

### 7.3 프로젝트 규칙

- PC 전용 이벤트만 사용 (터치/포인터 금지)
- 디자인 토큰 준수 (`--xeg-*` 변수만)
- TDD 워크플로 (RED → GREEN → REFACTOR)
- 벤더 API는 getter 함수 경유
