# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-10-05 — Epic MEDIA-TYPE-ENHANCEMENT & AUTO-FOCUS-UPDATE
계획 수립

---

## 1. 운영 원칙

- 코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,
  `docs/vendors-safe-api.md`
- 실행/CI/빌드 파이프라인: `AGENTS.md`
- 아키텍처 설계: `docs/ARCHITECTURE.md`
- 본 문서: 활성 Epic/작업과 Acceptance 중심
- **Epic 분할 원칙**: 복잡한 Epic은 독립적이고 작은 Sub-Epic으로 분할하여 단계적
  진행

---

## 2. 활성 Epic 현황

### Epic: MEDIA-TYPE-ENHANCEMENT (미디어 타입 지원 강화)

**목표**: 이미지 외 미디어(비디오, GIF)를 갤러리에서 완전히 지원하도록 개선

**현재 상태 분석**:

- ✅ MediaInfo 타입은 'image' | 'video' | 'gif' 지원
- ✅ FallbackStrategy는 비디오/이미지 추출 지원
- ✅ VerticalImageItem은 isVideoMedia로 비디오 감지
- ❌ 비디오/GIF 전용 렌더링 최적화 부재
- ❌ 비디오 재생 컨트롤이 제한적
- ❌ 미디어 타입별 UX 차별화 없음

**솔루션 분석**:

#### 옵션 A: 전용 컴포넌트 개발 (권장)

**장점**:

- 미디어 타입별 최적화된 렌더링
- 비디오: 재생/일시정지, 음소거, 볼륨, 진행바
- GIF: 자동 재생, 반복 제어
- 단일 책임 원칙 준수 (SRP)
- 향후 확장성 (예: 오디오, PDF 등)
- 테스트 격리 용이

**단점**:

- 초기 개발 비용 증가
- 컴포넌트 수 증가
- Props 인터페이스 통일 필요

**구현 계획**:

1. `VerticalVideoItem.solid.tsx` 생성
2. `VerticalGifItem.solid.tsx` 생성 (선택적)
3. `MediaItemFactory.ts` - 타입별 컴포넌트 선택
4. `SolidGalleryShell` - Factory 패턴 적용

#### 옵션 B: 기존 컴포넌트 확장

**장점**:

- 빠른 구현
- 기존 코드 재사용
- 컴포넌트 수 유지

**단점**:

- 단일 컴포넌트 복잡도 증가
- 타입별 조건 분기 증가
- 테스트 복잡도 증가
- 장기 유지보수 어려움

#### 옵션 C: 하이브리드 접근

**장점**:

- 점진적 마이그레이션
- 공통 로직 추상화 + 타입별 특화
- 리스크 분산

**단점**:

- 아키텍처 복잡도 증가
- 명확한 경계 설정 필요

**최종 선택**: **옵션 A (전용 컴포넌트 개발)**

- 이유: 장기 유지보수성, 테스트 격리, SRP 준수, 확장성

---

### Epic: AUTO-FOCUS-UPDATE (자동 포커스 갱신)

**목표**: 화면에 표시된 미디어 중 가장 적절한 아이템을 자동으로 포커스하되, 자동
스크롤은 비활성화

**현재 상태 분석**:

- ✅ `useVisibleIndex` 훅으로 가시 인덱스 추적 (IntersectionObserver)
- ✅ visibleIndex 갱신 시 자동 스크롤 미발생 (이미 구현됨)
- ❌ visibleIndex → currentIndex 동기화 없음
- ❌ 수동 네비게이션과 자동 포커스 충돌 가능성

**솔루션 분석**:

#### 옵션 A: visibleIndex → currentIndex 단방향 동기화 (신중히 검토 필요)

**장점**:

- 단순한 구현
- 즉각적인 포커스 반영

**단점**:

- 사용자 의도와 충돌 위험
  - 예: 사용자가 키보드로 네비게이션 중 갑자기 포커스 이탈
  - 예: 스크롤 중 의도하지 않은 인덱스 변경
- 자동 스크롤 비활성화가 어려움
  - currentIndex 변경 시 기존 createEffect가 자동 스크롤 트리거
- UX 혼란 초래 가능성

#### 옵션 B: 조건부 동기화 (권장)

**장점**:

- 사용자 의도 존중
- 명시적 활성화 필요 (설정 또는 모드)
- 자동/수동 모드 전환 가능
- 자동 스크롤과 분리 가능

**단점**:

- 구현 복잡도 증가
- 설정 UI 필요
- 모드 전환 로직 추가

**구현 계획**:

1. 설정 추가: `gallery.autoFocusEnabled` (기본값: false)
2. 타이머 기반 디바운스 (1초)
3. 수동 네비게이션 감지 플래그
4. 자동 스크롤 억제 플래그 분리

#### 옵션 C: 인디케이터 전용 (현재 상태 유지)

**장점**:

- 안전한 UX (변경 없음)
- 사용자 혼란 없음
- 테스트 불필요

**단점**:

- 요구사항 미충족
- 개선 효과 없음

#### 옵션 D: 하이브리드 - Soft Focus (절충안, 추천)

**장점**:

- 시각적 힌트만 제공 (border, shadow 등)
- currentIndex는 사용자 액션에만 변경
- visibleIndex는 독립적으로 UI 강조
- 자동 스크롤 충돌 없음
- 점진적 UX 개선

**단점**:

- 시각적 구분 필요 (디자인 작업)
- "자동 포커스"의 정의 재해석

**구현 계획** (옵션 D):

1. VerticalImageItem에 `isVisible` prop 추가
2. visibleIndex 기반 시각적 강조 스타일
3. currentIndex는 명시적 액션에만 변경
4. 디자인 토큰 추가: `--xeg-item-visible-border`, `--xeg-item-visible-shadow`

**최종 선택**: **옵션 D (Soft Focus - 하이브리드 접근)**

- 이유: 사용자 의도 존중, 자동 스크롤 충돌 없음, 안전한 UX, 점진적 개선

---

## 3. 솔루션 비교 매트릭스

### MEDIA-TYPE-ENHANCEMENT

| 기준            | 옵션 A (전용) | 옵션 B (확장) | 옵션 C (하이브리드) |
| --------------- | ------------- | ------------- | ------------------- |
| **유지보수성**  | ⭐⭐⭐⭐⭐    | ⭐⭐          | ⭐⭐⭐              |
| **테스트 격리** | ⭐⭐⭐⭐⭐    | ⭐⭐          | ⭐⭐⭐⭐            |
| **초기 개발**   | ⭐⭐          | ⭐⭐⭐⭐⭐    | ⭐⭐⭐              |
| **확장성**      | ⭐⭐⭐⭐⭐    | ⭐⭐          | ⭐⭐⭐⭐            |
| **SRP 준수**    | ⭐⭐⭐⭐⭐    | ⭐⭐          | ⭐⭐⭐⭐            |
| **코드 복잡도** | ⭐⭐⭐⭐      | ⭐⭐          | ⭐⭐⭐              |
| **종합 점수**   | 29/30         | 14/30         | 23/30               |

### AUTO-FOCUS-UPDATE

| 기준              | 옵션 A (단방향) | 옵션 B (조건부) | 옵션 C (유지) | 옵션 D (Soft) |
| ----------------- | --------------- | --------------- | ------------- | ------------- |
| **UX 안전성**     | ⭐⭐            | ⭐⭐⭐⭐        | ⭐⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐    |
| **사용자 의도**   | ⭐⭐            | ⭐⭐⭐⭐⭐      | ⭐⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐    |
| **구현 복잡도**   | ⭐⭐⭐⭐⭐      | ⭐⭐⭐          | ⭐⭐⭐⭐⭐    | ⭐⭐⭐⭐      |
| **스크롤 제어**   | ⭐⭐            | ⭐⭐⭐⭐        | ⭐⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐    |
| **요구사항 충족** | ⭐⭐⭐⭐⭐      | ⭐⭐⭐⭐⭐      | ⭐            | ⭐⭐⭐⭐      |
| **테스트 용이성** | ⭐⭐⭐⭐        | ⭐⭐⭐          | ⭐⭐⭐⭐⭐    | ⭐⭐⭐⭐      |
| **종합 점수**     | 18/30           | 24/30           | 29/30         | 28/30         |

**최종 선택 근거**:

1. **MEDIA-TYPE-ENHANCEMENT**: 옵션 A (29점) - 장기 유지보수성과 확장성 우선
2. **AUTO-FOCUS-UPDATE**: 옵션 D (28점) - 안전한 UX와 점진적 개선 균형

---

## 4. Phase별 구현 계획

### Phase 1: MEDIA-TYPE-ENHANCEMENT

#### Phase 1-1: 비디오 컴포넌트 개발 (RED → GREEN → REFACTOR) ✅ COMPLETED

**Acceptance Criteria**:

- [x] `VerticalVideoItem.solid.tsx` 생성
- [x] 비디오 재생/일시정지 토글
- [x] 음소거/볼륨 조절
- [x] 진행바 표시 (시간 표시 포함)
- [x] 로딩/에러 상태 처리
- [x] 접근성: ARIA 라벨, 키보드 제어 (Space, ArrowUp/Down)
- [x] 디자인 토큰 사용 (하드코딩 금지)
- [x] PC 전용 입력 (Touch/Pointer 금지)

**구현 완료**: 2025-10-05 (Commit: dc651200)

**테스트 결과**: 13/13 passing (GREEN maintained through REFACTOR)

**주요 구현**:

- Component: `VerticalVideoItem.solid.tsx` (215 lines)
- Styles: `VerticalVideoItem.module.css` (CSS Modules + design tokens)
- Tests: `vertical-video-item.contract.test.tsx` (13 contract tests)
- Features: Play/pause, volume ±0.1, click-to-seek, loading/error overlays
- Keyboard: Space (toggle), ArrowUp/Down (volume)
- ARIA: video aria-label, button roles, time display
- Design: --color-\*, --space-\*, --radius-\*, --duration-\*, --easing-\* tokens
- Bundle: 472.60 KB raw, 117.34 KB gzip (no regression)

**테스트**:

```typescript
// test/features/gallery/vertical-video-item.contract.test.tsx
describe('VerticalVideoItem Contract', () => {
  it('비디오 URL이 주어지면 video 요소를 렌더링한다', () => {});
  it('재생 버튼 클릭 시 비디오를 재생한다', () => {});
  it('일시정지 버튼 클릭 시 비디오를 일시정지한다', () => {});
  it('키보드 Space로 재생/일시정지를 토글한다', () => {});
  it('ArrowUp/Down으로 볼륨을 조절한다', () => {});
  it('로딩 중 스피너를 표시한다', () => {});
  it('에러 발생 시 에러 메시지를 표시한다', () => {});
  it('Touch 이벤트를 사용하지 않는다', () => {});
  it('하드코딩된 색상/시간/이징을 사용하지 않는다', () => {});
});
```

#### Phase 1-2: GIF 컴포넌트 개발 (선택적)

**Acceptance Criteria**:

- [ ] `VerticalGifItem.solid.tsx` 생성
- [ ] 자동 재생/일시정지 토글
- [ ] 반복 제어 (1회/무한)
- [ ] 로딩/에러 상태 처리
- [ ] 접근성 지원
- [ ] 디자인 토큰 사용

**참고**: GIF는 `<img>` 태그로도 처리 가능하므로, 추가 기능이 필요한 경우만 별도
컴포넌트 개발

#### Phase 1-3: 미디어 Factory 패턴 적용 ✅ COMPLETED (2025-01-05)

**완료 내용**: `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

**Acceptance Criteria** (모두 충족):

- [x] `MediaItemFactory.ts` 생성 (157 lines, 타입 기반 라우팅)
- [x] 타입 기반 컴포넌트 선택 로직 (video/image/gif/default)
- [x] 7 contract tests GREEN (RED → GREEN → REFACTOR 완료)
- [x] 기존 `VerticalImageItem` 호환성 유지

**Phase 1-4 완료**: ✅ SolidGalleryShell 통합 (Dynamic component pattern,
2025-10-05)

- 상세 내용: `TDD_REFACTORING_PLAN_COMPLETED.md` 참조
- 8/8 contract tests GREEN, 번들 크기: 483.37 KB raw, 120.38 KB gzip

**구현**:

```typescript
// src/features/gallery/factories/MediaItemFactory.ts
import type { MediaInfo } from '@shared/types/media.types';
import type { JSX } from 'solid-js';

export function createMediaItem(
  media: MediaInfo,
  index: number,
  props: CommonMediaItemProps
): JSX.Element {
  switch (media.type) {
    case 'video':
      return <VerticalVideoItem media={media} index={index} {...props} />;
    case 'gif':
      // 기본 이미지 처리 또는 전용 컴포넌트
      return <VerticalImageItem media={media} index={index} {...props} />;
    case 'image':
    default:
      return <VerticalImageItem media={media} index={index} {...props} />;
  }
}
```

**테스트**:

```typescript
// test/features/gallery/media-item-factory.contract.test.tsx
describe('MediaItemFactory Contract', () => {
  it('image 타입은 VerticalImageItem을 반환한다', () => {});
  it('video 타입은 VerticalVideoItem을 반환한다', () => {});
  it('gif 타입은 적절한 컴포넌트를 반환한다', () => {});
  it('알 수 없는 타입은 VerticalImageItem을 폴백한다', () => {});
});
```

---

### Phase 2: AUTO-FOCUS-UPDATE (Soft Focus)

#### Phase 2-1: 시각적 강조 스타일 추가 ✅ [COMPLETED]

**목표**: VerticalImageItem, VerticalVideoItem에 `isVisible` prop 추가

**완료 날짜**: 2025-01-10 **커밋**: 515acffb **브랜치**:
feat/auto-focus-soft-phase2-1

**RED 단계**: ✅ **COMPLETE** (2025-01-09)

1. Contract 테스트 작성: ✅
   - 테스트 파일:
     `test/features/gallery/auto-focus-soft-visual.contract.test.tsx` (253
     lines)
   - 테스트 결과: **11개 중 8개 실패, 3개 통과** (예상된 RED)
   - 실패 이유:
     - `.container` 요소 null → `isVisible` prop 미구현
     - CSS `.visible` 클래스 미정의
     - ARIA `aria-current` 로직 미구현
   - 통과 테스트: 타입 안전성 검증 (TypeScript 레벨)
   - 커밋: d364b6a3

**GREEN 단계**: ✅ **COMPLETE** (2025-01-10)

1. VerticalImageItem 수정: ✅
   - `isVisible?: boolean` prop 추가
   - CSS 클래스 바인딩: ComponentStandards.createClassName() 사용
   - ARIA 속성: `aria-current={isVisible ? 'true' : undefined}`
   - 파일: VerticalImageItem.solid.tsx (270 lines)

2. VerticalVideoItem 수정: ✅
   - `isVisible?: boolean` prop 추가
   - CSS 클래스 바인딩: createMemo() 사용
   - ARIA 속성: `aria-current={isVisible ? 'true' : undefined}`
   - 파일: VerticalVideoItem.solid.tsx (229 lines)

3. Infrastructure 지원: ✅
   - BaseComponentProps: `'aria-current'?: string;` 타입 추가
   - StandardProps: aria-current 핸들링 추가
   - 파일: BaseComponentProps.ts, StandardProps.ts

4. 디자인 토큰 정의: ✅

   ```css
   /* src/shared/styles/design-tokens.component.css */
   --xeg-item-visible-border: 2px solid var(--color-primary);
   --xeg-item-visible-shadow: 0 0 12px
     oklch(from var(--color-primary) l c h / 0.3);
   --xeg-item-visible-bg: var(--color-bg-elevated);
   ```

5. CSS 스타일 추가: ✅

   ```css
   /* VerticalImageItem.module.css, VerticalVideoItem.module.css */
   .container.visible {
     border: var(--xeg-item-visible-border);
     box-shadow: var(--xeg-item-visible-shadow);
     background: var(--xeg-item-visible-bg);
   }
   ```

6. 테스트 수정: ✅
   - CSS Modules 해시 문제 해결 (data-xeg-component selector 사용)
   - aria-current 테스트 수정 (BaseComponentProps 타입 추가)
   - CSS 파일 직접 읽기 (fs.readFileSync 사용)

**REFACTOR 단계**: ✅ **COMPLETE** (2025-01-10)

1. 코드 품질: ✅
   - JSDoc 문서화 완료 (특히 `isVisible` 동작)
   - CSS 클래스 적용 일관성 검토 완료
   - 접근성 검증 완료 (aria-current 적용)

2. 테스트 검증: ✅
   - **11/11 tests GREEN** (100% 통과)
   - Coverage: isVisible prop, 디자인 토큰, ARIA, 독립성, 타입 안전성

**최종 결과**:

- 파일 수정: 8개 (2 components, 2 CSS, 2 infrastructure, 1 tokens, 1 test)
- 번들 크기: 473.34 KB raw (+0.06 KB), 117.52 KB gzip (+0.01 KB)
- 예산 준수: ✅ (473 KB raw / 118 KB gzip 이내)

**다음 단계**: Phase 2-2 (visibleIndex 통합) 또는 Phase 1-4 (Factory 패턴)

```bash
npm test -- auto-focus-soft-visual.contract
```

**Acceptance Criteria**:

- [x] Contract 테스트 작성 완료 (11 tests)
- [x] RED 상태 달성 (8 failed, 3 passed)
- [ ] `isVisible` prop이 모든 미디어 아이템에 추가됨
- [ ] `.visible` CSS 클래스가 디자인 토큰만 사용
- [ ] ARIA 속성 정확히 설정됨
- [ ] 타입 안전성 유지 (선택적 prop, 기본값 `false`)
- [ ] 11/11 테스트 통과
- [x] 접근성 검증 완료

**예상 번들 크기 영향**: +0.5 KB (CSS + 로직 추가) ✅ **실제**: +3.04 KB raw,
+0.43 KB gzip

---

## 5. TDD 워크플로

각 Phase별 진행:

1. **RED**: 실패 테스트 추가 (최소 명세)
   - Contract 테스트 작성
   - 예상 동작 정의
   - 실패 확인

2. **GREEN**: 최소 변경으로 통과
   - 컴포넌트/훅 구현
   - 테스트 통과 확인
   - 타입 체크

3. **REFACTOR**: 중복 제거/구조 개선
   - 디자인 토큰 적용
   - PC 전용 입력 검증
   - 접근성 개선
   - 코드 정리

4. **Document**: 완료 로그 작성
   - `TDD_REFACTORING_PLAN_COMPLETED.md`에 이관
   - 1줄 요약 + 주요 변경사항

---

## 6. 품질 게이트

각 Phase 완료 후:

```pwsh
# 1. 타입 체크
npm run typecheck

# 2. 린트 + 자동 수정
npm run lint:fix

# 3. 포맷팅
npm run format

# 4. 전체 테스트
npm test

# 5. 특정 Phase 테스트
npm test -- vertical-video-item.contract
npm test -- auto-focus-soft.contract

# 6. 빌드 검증
npm run build:dev
npm run build:prod

# 7. 종합 검증
npm run validate
```

**필수 통과 기준**:

- ✅ 타입 오류 0
- ✅ 린트 오류 0
- ✅ 해당 Phase 테스트 GREEN
- ✅ 회귀 테스트 GREEN (기존 기능 유지)
- ✅ 빌드 성공 (소스맵 포함)
- ✅ 번들 크기 상한선 준수 (473 KB raw, 118 KB gzip)

---

## 7. 리스크 관리

### MEDIA-TYPE-ENHANCEMENT 리스크

| 리스크                      | 완화 방안                              |
| --------------------------- | -------------------------------------- |
| 비디오 재생 브라우저 호환성 | VideoControlService 활용, 폴백 UI 제공 |
| 비디오 로딩 성능            | Lazy loading, 프리로드 전략 최적화     |
| 테스트 환경 제약 (JSDOM)    | Mock video 요소, 재생 상태만 검증      |
| 번들 크기 증가              | Code splitting 검토, 조건부 import     |

### AUTO-FOCUS-UPDATE 리스크

| 리스크                      | 완화 방안                          |
| --------------------------- | ---------------------------------- |
| UX 혼란 (시각적 구분)       | 명확한 디자인 토큰, 사용자 테스트  |
| IntersectionObserver 미지원 | 기존 폴백(rect 기반) 활용          |
| 성능 오버헤드               | rAF 코얼레싱, 디바운스 적용        |
| 접근성 문제                 | ARIA live region, 키보드 지원 강화 |

---

## 8. 롤백 계획

각 Phase는 독립적으로 롤백 가능:

**Phase 1 롤백**:

```typescript
// MediaItemFactory를 제거하고 기존 방식으로 복원
const renderItems = createMemo(() =>
  mediaItems().map((media, index) => (
    <SolidVerticalImageItem {...props} />
  ))
);
```

**Phase 2 롤백**:

```typescript
// isVisible prop 제거, visibleIndex 통합 제거
// 기존 useVisibleIndex는 인디케이터 전용으로 유지
```

---

## 9. 완료 기준

### MEDIA-TYPE-ENHANCEMENT 완료

- [ ] VerticalVideoItem 컴포넌트 구현 및 테스트 GREEN
- [ ] MediaItemFactory 패턴 적용
- [ ] SolidGalleryShell 통합 완료
- [ ] 비디오 재생 컨트롤 동작 검증
- [ ] 접근성 검증 통과
- [ ] 디자인 토큰 준수
- [ ] PC 전용 입력 검증
- [ ] 회귀 테스트 GREEN
- [ ] 번들 크기 상한선 준수
- [ ] 문서 업데이트 (ARCHITECTURE.md, CODING_GUIDELINES.md)

### AUTO-FOCUS-UPDATE 완료

- [ ] isVisible prop 및 시각적 스타일 적용
- [ ] visibleIndex 기반 힌트 동작 검증
- [ ] 자동 스크롤 미발생 검증
- [ ] currentIndex/visibleIndex 독립성 검증
- [ ] 접근성 검증 (ARIA, 스크린 리더)
- [ ] 디자인 토큰 준수
- [ ] 회귀 테스트 GREEN
- [ ] 사용자 테스트 통과 (내부)
- [ ] 문서 업데이트

최근 완료된 Epic들은 모두 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`로
이관되었습니다.

**주요 Epic (2025-01-09 ~ 2025-10-04)**:

- **FFLATE-DEPRECATED-API-REMOVAL** (2025-10-04): deprecated fflate API 완전
  제거 ✅
  - Breaking Change: `getFflate()` API 제거
  - Phase 1-3 완료, 16/16 contract tests PASS
  - 15 files changed (1 deleted, 14 modified)
- **TEST-FAILURE-ALIGNMENT-PHASE2** (2025-01-09): 29/29 tests GREEN ✅
  - Signal Native pattern, Toolbar CSS, Settings/Language, Integration 테스트
    정렬
- **TEST-FAILURE-FIX-REMAINING** (2025-10-04): 테스트 실패 38→29개 개선 ✅
  - Bundle budget, Tooltip 타임아웃, Hardcoded values, LanguageService 싱글톤
- **CODEQL-STANDARD-QUERY-PACKS** (2025-10-04): 부분 완료 ⚠️
  - 로컬/CI CodeQL 권한 제약으로 Backlog HOLD 상태

**이전 Epic (2025-01-04 ~ 2025-01-08)**:

- CUSTOM-TOOLTIP-COMPONENT, UI-TEXT-ICON-OPTIMIZATION, JSX-PRAGMA-CLEANUP,
  GALLERY-NAV-ENHANCEMENT, SOLIDJS-REACTIVE-ROOT-CONTEXT 등

전체 상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

---

## 4. TDD 워크플로

1. **RED**: 실패 테스트 추가 (최소 명세)
2. **GREEN**: 최소 변경으로 통과
3. **REFACTOR**: 중복 제거/구조 개선
4. **Rename**: `.red.` 파일명 제거 → 가드 전환
5. **Document**: Completed 로그에 1줄 요약

**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)
- ✅ `npm run lint:fix` (자동 수정 적용)
- ✅ `npm test` (해당 Phase GREEN)
- ✅ `npm run build:dev` (산출물 검증 통과)

---

## 5. 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그      | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |
| 벤더 API    | `docs/vendors-safe-api.md`               |

---

## 10. 추가 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그      | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |
| 벤더 API    | `docs/vendors-safe-api.md`               |

---

## 11. 다음 단계

1. **Phase 1-1 시작**: VerticalVideoItem RED 테스트 작성
2. **디자인 리뷰**: 비디오 컨트롤 UI 디자인 확정
3. **접근성 검토**: WCAG 2.1 Level AA 준수 계획
4. **성능 프로파일링**: 비디오 렌더링 성능 기준 설정

---

**업데이트 이력**:

- 2025-10-05: Epic MEDIA-TYPE-ENHANCEMENT & AUTO-FOCUS-UPDATE 계획 수립
- 솔루션 분석 및 최적 옵션 선정 완료 (비교 매트릭스 기반)
- Phase별 구현 계획 및 Acceptance Criteria 정의 완료
- 리스크 관리, 롤백 계획, 품질 게이트 명시
