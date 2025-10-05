# TDD 리팩토링 활성 계획# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링본
문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링

Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로Epic들을
관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로

이관하여 히스토리를 분리합니다.이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-10-05 — 모든 활성 Epic 완료**최근 업데이트**: 2025-10-05
— 모든 활성 Epic 완료

---

## 1. 운영 원칙## 1. 운영 원칙

- 코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,-
  코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,

  `docs/vendors-safe-api.md` `docs/vendors-safe-api.md`

- 실행/CI/빌드 파이프라인: `AGENTS.md`- 실행/CI/빌드 파이프라인: `AGENTS.md`

- 아키텍처 설계: `docs/ARCHITECTURE.md`- 아키텍처 설계: `docs/ARCHITECTURE.md`

- 본 문서: 활성 Epic/작업과 Acceptance 중심- 본 문서: 활성 Epic/작업과
  Acceptance 중심

- **Epic 분할 원칙**: 복잡한 Epic은 독립적이고 작은 Sub-Epic으로 분할하여
  단계적- **Epic 분할 원칙**: 복잡한 Epic은 독립적이고 작은 Sub-Epic으로
  분할하여 단계적

  진행 진행

---

## 2. 활성 Epic 현황## 2. 활성 Epic 현황

### 현재 활성 Epic 없음**현재 활성 Epic 없음**

모든 Epic이 완료되었습니다. 완료된 Epic들은모든 Epic이 완료되었습니다. 완료된
Epic들은

[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)에서[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)에서

확인하실 수 있습니다.확인하실 수 있습니다.

### 최근 완료**최근 완료**:

- ✅ Epic TIMELINE-VIDEO-CLICK-FIX (2025-10-05, a54c3957): 타임라인 비디오 클릭-
  ✅ Epic TIMELINE-VIDEO-CLICK-FIX (2025-10-05, a54c3957): 타임라인 비디오 클릭

  감지 개선 + body-scroll-manager 통합 감지 개선 + body-scroll-manager 통합

- ✅ Epic MEDIA-TYPE-ENHANCEMENT (2025-10-05): 미디어 타입 지원 강화 (비디오,-
  ✅ Epic MEDIA-TYPE-ENHANCEMENT (2025-10-05): 미디어 타입 지원 강화 (비디오,

  GIF 컴포넌트) GIF 컴포넌트)

---

## 3. 향후 Epic 후보## 3. 향후 Epic 후보

현재 계획된 Epic이 없습니다._(현재 없음)_

향후 새로운 Epic이 추가될 수 있습니다. 제안이 있으시면 이슈를 생성해주세요.향후
새로운 Epic이 추가될 수 있습니다. 제안이 있으시면 이슈를 생성해주세요.

---

## 4. TDD 워크플로## 4. TDD 워크플로

1. **RED**: 실패 테스트 추가 (최소 명세)1. **RED**: 실패 테스트 추가 (최소 명세)

2. **GREEN**: 최소 변경으로 통과2. **GREEN**: 최소 변경으로 통과

3. **REFACTOR**: 중복 제거/구조 개선3. **REFACTOR**: 중복 제거/구조 개선

4. **Document**: Completed 로그에 이관4. **Document**: Completed 로그에 이관

### 품질 게이트**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)- ✅ `npm run typecheck` (strict 오류 0)

- ✅ `npm run lint:fix` (자동 수정 적용)- ✅ `npm run lint:fix` (자동 수정 적용)

- ✅ `npm test` (해당 Phase GREEN)- ✅ `npm test` (해당 Phase GREEN)

- ✅ `npm run build` (산출물 검증 통과)- ✅ `npm run build` (산출물 검증 통과)

---

## 5. 참조 문서## 5. 참조 문서

- **아키텍처**: [`ARCHITECTURE.md`](ARCHITECTURE.md)- **아키텍처**:
  [`ARCHITECTURE.md`](ARCHITECTURE.md)

- **코딩 가이드**: [`CODING_GUIDELINES.md`](CODING_GUIDELINES.md)- **코딩
  가이드**: [`CODING_GUIDELINES.md`](CODING_GUIDELINES.md)

- **벤더 API**: [`vendors-safe-api.md`](vendors-safe-api.md)- **벤더 API**:
  [`vendors-safe-api.md`](vendors-safe-api.md)

- **실행/CI**: [`../AGENTS.md`](../AGENTS.md)- **실행/CI**:
  [`../AGENTS.md`](../AGENTS.md)

- **완료된 Epic**:- **완료된 Epic**:

  [`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)
  [`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)

---

본 문서는 활성 Epic만 관리합니다. 완료된 Epic은본 문서는 활성 Epic만 관리합니다.
완료된 Epic은

`TDD_REFACTORING_PLAN_COMPLETED.md`로 자동
이관됩니다.`TDD_REFACTORING_PLAN_COMPLETED.md`로 자동 이관됩니다.

**솔루션 비교 분석**:

#### 옵션 A: 타임라인 전용 미디어 감지 전략 추가

**접근**: `TweetInfoExtractor`에 `TimelineSpecificTweetStrategy` 추가

**장점**:

- 기존 코드 변경 최소화
- 타임라인 특화 로직 명확히 분리
- 트윗 상세 페이지 동작에 영향 없음

**단점**:

- 코드 복잡도 증가 (새 전략 추가)
- 유지보수 포인트 추가 (타임라인 DOM 변경 시 별도 업데이트)
- 근본 원인(이벤트 차단) 해결하지 못함

**난이도**: M **예상 파일 수정**: 5개 (전략 추가, 테스트)

---

#### 옵션 B: 미디어 감지 로직 강화 (이벤트 차단 완화) ⭐ **권장**

**접근**: `shouldBlockGalleryTrigger()`의 비디오 제어 선택자 정밀화 +
`isProcessableMedia()` 비디오 감지 로직 강화

**장점**:

- 전체적인 감지 정확도 향상 (타임라인 + 트윗 상세 모두 개선)
- 단순한 구조 (기존 로직 개선)
- 근본 원인(과도한 차단) 직접 해결
- TDD 적용 용이

**단점**:

- 기존 동작에 미세한 영향 가능성 (회귀 테스트 필요)
- 트위터 UI 변경 시 재조정 필요할 수 있음

**난이도**: S **예상 파일 수정**: 3개 (MediaClickDetector, 테스트)

**구체적 개선 사항**:

1. `shouldBlockGalleryTrigger()` 비디오 제어 선택자 정밀화
   - 현재: `[data-testid="videoComponent"] button` (너무 포괄적)
   - 개선: 실제 컨트롤 버튼만 선택 (재생/일시정지, 음소거, 볼륨)
2. `isProcessableMedia()` 타임라인 비디오 감지 추가
   - `video` 태그 직접 감지
   - `[data-testid="videoPlayer"]` 컨테이너 우선 순위 상향
3. 미디어 컨테이너 범위 확대
   - `div[role="button"]` 등 타임라인 특화 선택자 추가

---

#### 옵션 C: 하이브리드 전략 (URL 기반 + DOM 구조 분석)

**접근**: 페이지 URL 패턴 감지 (`/status/` vs 홈 타임라인) + 각 컨텍스트에 맞는
DOM 전략 자동 선택

**장점**:

- 가장 정확한 감지 (컨텍스트 인지)
- 타임라인/상세 페이지 모두 최적화

**단점**:

- 구현 복잡도 높음
- URL 패턴 의존성 (트위터 URL 구조 변경 시 취약)
- 유지보수 부담 증가

**난이도**: H **예상 파일 수정**: 8개 (URL 감지, 컨텍스트 관리, 전략 분기)

---

#### 옵션 D: 로깅 강화 후 실제 DOM 구조 분석 (진단 우선)

**접근**: Phase 1에서 타임라인 DOM 구조 로깅 → Phase 2에서 targeted fix

**장점**:

- 정확한 원인 파악 (추측 아닌 데이터 기반)
- 위험도 낮음 (진단만 먼저 수행)
- 실제 문제에 맞는 최적 솔루션 선택 가능

**단점**:

- 2단계 작업 필요 (진단 + 수정)
- 즉시 수정 불가 (사용자 로그 수집 필요)

**난이도**: S (진단) + M (수정) **예상 파일 수정**: Phase 1 (2개), Phase 2 (TBD)

---

**선택된 솔루션**: **옵션 B** (미디어 감지 로직 강화)

**선택 이유**:

1. **직접적 해결**: 근본 원인(과도한 이벤트 차단)을 직접 해결
2. **낮은 리스크**: 단순한 로직 개선, 회귀 테스트로 안전성 보장
3. **TDD 친화적**: RED(실패 테스트) → GREEN(구현) → REFACTOR 적용 용이
4. **유지보수성**: 기존 구조 유지, 복잡도 증가 없음
5. **범용성**: 타임라인뿐 아니라 전체 미디어 감지 정확도 향상

**백업 계획**: 옵션 B로 개선 후에도 특정 타임라인 케이스에서 실패 시 → 옵션 D
(로깅) 추가 진단

---

### Epic: MEDIA-TYPE-ENHANCEMENT (미디어 타입 지원 강화) ✅ **100% COMPLETE**

**목표**: 이미지 외 미디어(비디오, GIF)를 갤러리에서 완전히 지원하도록 개선

**최종 상태** (2025-10-05):

- ✅ Phase 1-1: VerticalVideoItem 개발 완료 (2025-10-05)
- ✅ Phase 1-2: VerticalGifItem 개발 완료 (2025-10-05)
- ✅ Phase 1-3: MediaItemFactory 패턴 적용 (2025-01-05)
- ✅ Phase 1-4: SolidGalleryShell 통합 완료 (2025-10-05)

**달성 내용**:

- ✅ MediaInfo 타입은 'image' | 'video' | 'gif' 지원
- ✅ 비디오 전용 컴포넌트 (재생 컨트롤, 진행바, 볼륨)
- ✅ GIF 전용 컴포넌트 (Canvas 기반 재생/일시정지, 반복 제어)
- ✅ Factory 패턴으로 타입별 자동 라우팅
- ✅ 미디어 타입별 최적화된 UX

---

## 4. Phase별 구현 계획

### Phase 1: MEDIA-TYPE-ENHANCEMENT ✅ **100% COMPLETE**

모든 Phase 완료. 상세 내용:
[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)

#### Phase 1-1: 비디오 컴포넌트 개발 ✅ COMPLETED (2025-10-05, dc651200)

- 13/13 tests passing
- VerticalVideoItem.solid.tsx (215 lines)
- 번들: 472.60 KB raw, 117.34 KB gzip

#### Phase 1-2: GIF 컴포넌트 개발 ✅ COMPLETED (2025-10-05, 80648630)

- 24/24 tests passing (17 GIF + 7 Factory)
- VerticalGifItem.solid.tsx (367 lines)
- Canvas 기반 재생 제어, 반복 모드

#### Phase 1-3: MediaItemFactory ✅ COMPLETED (2025-01-05)

- 7/7 tests passing
- 타입 기반 컴포넌트 라우팅

#### Phase 1-4: SolidGalleryShell 통합 ✅ COMPLETED (2025-10-05, c19c0263, 24ad2ef0)

- 8/8 tests passing
- 번들: 483.37 KB raw, 120.38 KB gzip

---

### Phase 3: TIMELINE-VIDEO-CLICK-FIX 🔄 **IN PROGRESS**

#### Phase 3-1: 미디어 감지 로직 진단 및 강화 (RED)

**목표**: 타임라인 비디오 클릭 시 갤러리 열림 보장

**예상 작업량**: S **예상 기간**: 2-3일

**Acceptance Criteria**:

1. **타임라인 비디오 감지**: ✅ 타임라인에서 비디오 클릭 시
   `isProcessableMedia()`가 `true` 반환
2. **트윗 상세 페이지 호환성**: ✅ 기존 트윗 상세 페이지 동작 유지 (회귀 없음)
3. **이벤트 차단 정밀화**: ✅ 실제 비디오 컨트롤만 차단, 비디오 영역 클릭은 허용
4. **테스트 커버리지**: ✅ 타임라인/트윗 상세 시나리오 모두 테스트

**RED 단계**: 🔄 **IN PROGRESS**

1. ✅ Contract 테스트 작성
   - 테스트 파일:
     `test/shared/utils/media/timeline-video-click.contract.test.ts`
   - 예상 테스트:
     - `타임라인 비디오 컨테이너 클릭 시 isProcessableMedia 성공`
     - `타임라인 비디오 영역 클릭 시 갤러리 트리거`
     - `트윗 상세 페이지 비디오 클릭 정상 동작 (회귀 없음)`
     - `비디오 재생 버튼 클릭 시 갤러리 차단`
     - `shouldBlockGalleryTrigger 정밀 차단 (볼륨, 진행바만)`

2. ⏳ 테스트 실행 및 RED 확인
   - `npx vitest run test/shared/utils/media/timeline-video-click.contract.test.ts`
   - 예상: 5개 중 3-4개 실패 (타임라인 감지 미구현)

**GREEN 단계**: ⏳ **PENDING**

1. `MediaClickDetector.shouldBlockGalleryTrigger()` 수정
   - 비디오 제어 선택자 정밀화
   - 현재: `[data-testid="videoComponent"] button`,
     `[data-testid="videoPlayer"] button`
   - 개선:

     ```typescript
     const videoControlSelectors = [
       'button[aria-label*="재생"]',
       'button[aria-label*="일시정지"]',
       'button[aria-label*="Play"]',
       'button[aria-label*="Pause"]',
       '[role="slider"][aria-label*="진행"]', // 진행바
       '[role="slider"][aria-label*="볼륨"]', // 볼륨
       'button[aria-label*="음소거"]',
       'button[aria-label*="Mute"]',
     ];
     ```

2. `MediaClickDetector.isProcessableMedia()` 강화
   - 타임라인 비디오 선택자 추가
   - 우선순위 조정: `video` 태그 직접 감지 상향
   - 코드 예시:

     ```typescript
     // 타임라인 비디오 직접 감지
     if (target.tagName === 'VIDEO') {
       logger.info('✅ MediaClickDetector: 비디오 요소 직접 클릭 (타임라인)');
       return true;
     }
     // 비디오 컨테이너 확장
     const videoSelectors = [
       SELECTORS.VIDEO_PLAYER,
       'video',
       '[data-testid="videoPlayer"]',
       '[data-testid="videoComponent"]',
       'div[aria-label*="동영상"]',
       'div[role="button"]', // 타임라인 비디오 래퍼
     ];
     ```

3. 테스트 실행 및 GREEN 확인
   - 모든 테스트 통과
   - 번들 크기 변화 확인 (±0.5 KB 이내 목표)

**REFACTOR 단계**: ⏳ **PENDING**

1. 중복 선택자 통합
2. 로깅 메시지 정리
3. 타입 안전성 강화 (필요 시)
4. 성능 최적화 (선택자 평가 순서)

**검증**:

- `npm run typecheck` ✅
- `npm run lint:fix` ✅
- `npm test` (전체) ✅
- `npm run build` ✅
- 수동 테스트: 타임라인 비디오 클릭 → 갤러리 열림 ✅

**예상 파일 수정**:

1. `src/shared/utils/media/MediaClickDetector.ts` (수정)
2. `test/shared/utils/media/timeline-video-click.contract.test.ts` (신규)
3. `docs/TDD_REFACTORING_PLAN.md` (업데이트)

**예상 번들 영향**: ±0.3 KB raw, ±0.1 KB gzip (미미함)

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
