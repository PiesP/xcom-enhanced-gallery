# TDD-driven Refactoring Plan (xcom-enhanced-gallery)

> **Last updated**: 2025-01-26 **Status**: Phase 9 Completed - Ready for New
> Features

## Overview

모든 Phase는 **RED → GREEN → REFACTOR** 사이클로 진행됩니다. 테스트를 먼저
작성하고, 최소 구현으로 GREEN을 달성한 뒤, 품질을 개선합니다.

---

## Recent Completions

### Phase 9: Solid.js Vendors Getter 전환 (2025-01-26 완료 ✅)

**치명적 버그 해결**: 59개 파일에서 `solid-js`, `solid-js/web`를 직접 import하던
것을 vendors getter 경유로 전환하여 TDZ 문제를 해결하고 Solid.js 반응성 시스템을
정상화했습니다.

**해결된 4가지 버그**:

1. ✅ 자동 스크롤 기능 정상 작동
2. ✅ 자동 포커스 이동 정상 작동
3. ✅ 설정 모달 정상 표시
4. ✅ 다크 모드 아이콘 정상 표시

**주요 변경**:

- 42개 파일을 자동화 스크립트로 변환
- Vendor manager 타입 export 수정 (type vs runtime 분리)
- Vendors getter 규칙 100% 준수 달성

**메트릭**: Dev 1,029.96 KB, Prod 330.73 KB (gzip 88.35 KB)

상세 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`를 참고하세요.

---

## Phase 7 Completion Summary

### Completed

- **Phase 7.1**: 키보드 네비게이션 구현
  - ArrowLeft/Right로 이미지 이동
  - Home/End로 처음/마지막 이동
  - Escape로 갤러리 닫기
  - focusTrap 통합 및 코드 정리
  - 커밋: 70453d7d (GREEN), af4c3813 (REFACTOR)

- **Phase 7.2**: 접근성 강화 (WCAG 2.1 AA 준수)
  - GalleryContainer ARIA 속성 (role, aria-modal, aria-label)
  - VerticalImageItem 위치 정보 aria-label
  - aria-current로 활성 아이템 표시
  - Screen reader 완전 지원
  - 커밋: 90b6f256 (RED), 397345e6 (GREEN)

- **Phase 7.3-7.5**: 재평가 후 종료
  - 트위터 미디어 최대 8개 제한으로 인해 대부분의 최적화 불필요
  - fflate 이미 제거됨 (Phase 1)으로 Web Worker 불필요
  - 사용자 피드백 기반 재평가 권장

### Metrics (Final)

- **Build Size**: Dev 1,032 KB, Prod 329 KB (gzip 88 KB)
- **TypeScript**: 100% strict, 0 errors
- **Accessibility**: WCAG 2.1 AA 준수 ✅
- **Keyboard Navigation**: 100% 키보드 접근 가능 ✅
- **Test Coverage**: 90%+

### 달성 목표

- ✅ 키보드 전용 사용자 100% 접근 가능
- ✅ Screen reader 완전 지원 (WCAG 2.1 AA)
- ✅ 법적 준수 및 포용적 디자인
- ✅ PC 전용 이벤트 유지 (설계 원칙 준수)

---

## Phase 8.5: 추가 Deprecated 코드 정리 (완료 ✅)

### 목표

Phase 8.4에서 memoization.ts를 제거했으나, 추가로 정리 가능한 deprecated 코드가
발견되었습니다:

- ✅ HOC 디렉토리 완전 제거 (Phase 5.4에서 deprecated)
- ✅ createZipFromItems 및 관련 레거시 함수 제거
- ✅ 사용되지 않는 상수 및 헬퍼 제거

### 완료된 작업

#### 8.5.1: HOC 디렉토리 제거

**제거 대상**: `src/shared/components/hoc/` 전체 디렉토리

- Phase 5.4에서 deprecated, Solid.js로 전환
- src/test 전역 검색: 사용처 0건 확인
- 안전하게 제거

#### 8.5.2: ZIP 레거시 함수 제거

**제거된 항목**:

- `createZipFromItems()` - 레거시 ZIP 생성 함수
- `downloadFilesForZip()` - 파일 다운로드 헬퍼
- `downloadMediaForZip()` - 개별 미디어 다운로드
- `chunkArray()` - 배열 분할 유틸리티
- `generateUniqueFilename()` - 중복 방지 파일명 생성
- `DEFAULT_ZIP_CONFIG` - 미사용 설정 상수
- 미사용 import: `safeParseInt`

**유지된 API**:

- `createZipBytesFromFileMap()` - 현재 활성 ZIP API
- `MediaItemForZip`, `ZipCreationConfig` 타입

#### 8.5.3: Deprecated 메서드 검증 (유지 결정)

**검증 항목**:

- `ServiceManager.getDiagnostics()` → service-diagnostics.ts에서 사용 (진단
  도구)
- `BrowserService.getDiagnostics()` → 브라우저 진단 도구에서 사용
- `UnifiedToastManager` export → ToastController, ToastContainer에서 사용 (하위
  호환성)
- MediaService deprecated 메서드 → Phase 8.4에서 검증 완료 (실사용)
- Legacy Twitter normalizers → Phase 8.4에서 검증 완료 (API 필수)

### 최종 메트릭

| 메트릭     | Phase 8.4 이후 | Phase 8.5   | 변화            |
| ---------- | -------------- | ----------- | --------------- |
| Dev 빌드   | 1,030.40 KB    | 1,025.86 KB | **-4.54 KB** ✅ |
| Prod 빌드  | 329.09 KB      | 329.09 KB   | 변화 없음       |
| gzip       | 87.76 KB       | 87.76 KB    | 변화 없음       |
| 모듈 수    | 252            | 251         | **-1**          |
| 의존성     | 626            | 625         | **-1**          |
| TypeScript | 0 errors       | 0 errors    | ✅              |

### 제거된 코드 요약

- HOC 디렉토리: 1개 파일 (~15 lines)
- ZIP 레거시 함수: ~120 lines
- 총 제거: ~135 lines
- 번들 크기 감소: 4.54 KB

---

---

## Phase 10: Post-SolidJS 전환 잔재 정리 (진행 중)

### Phase 10 목표

Phase 9에서 Solid.js vendors getter 전환을 완료했으나, 테스트 코드와 일부 미사용
코드에 Preact 관련 잔재가 남아있습니다. 이를 완전히 제거하여 Solid.js 전환의
완전성을 확보합니다.

### 배경

**현재 상태 (2025-01-07)**:

- ✅ 소스 코드: Preact 직접 import 완전 제거 (Phase 9)
- ⚠️ 테스트 코드: Preact 관련 유틸리티 및 모킹 파일 다수 잔존
- ⚠️ Orphan 모듈: `focusScope-solid.ts` (dependency-cruiser 경고)
- ⚠️ TODO 주석: KeyboardHelpOverlay Solid 버전 필요 (3곳)

### 작업 범위

#### 10.1: 테스트 Preact 잔재 제거 🔴 **높은 우선순위**

**제거 대상 파일**:

1. `test/utils/vendor-testing-library.ts` - getPreact() 사용
2. `test/utils/render-with-vendor-preact.tsx` - Preact 렌더링 유틸
3. `test/__mocks__/vendor.mock.js` - mockPreactAPI, mockPreactSignalsAPI
4. `test/__mocks__/vendor.mock.ts` - 중복 Preact 모킹
5. `test/__mocks__/vendor-mock-clean.js` - Preact Hooks/Signals 모킹

**수정 대상 테스트**:

- `test/unit/vendors/*.test.ts` - getPreact 참조 제거 또는 Solid 전환
- `test/unit/shared/runtime-vendor-initialization.test.ts` - getPreactCompat
  제거
- `test/unit/ui/toolbar.icon-accessibility.test.tsx` - Preact 모킹 제거

**수용 기준**:

- [ ] 모든 테스트 파일에서 `getPreact` 참조 0건
- [ ] `__mocks__`에서 Preact 관련 모킹 완전 제거
- [ ] 테스트 실행 GREEN 유지 (npm test)
- [ ] 빌드 크기 변화 없음 또는 감소

**예상 결과**:

- 제거 파일: 5개
- 수정 테스트: ~10개
- 테스트 복잡도 감소

#### 10.2: Orphan 모듈 정리 🔴 **높은 우선순위**

**대상 파일**: `src/shared/primitives/focusScope-solid.ts`

**문제**:

- dependency-cruiser에서 orphan 모듈로 탐지
- `createFocusScope()` 함수 정의만 있고 실제 사용처 없음
- 53라인, 기능: Focus scope ref 관리 (Solid 패턴)

**조사 항목**:

1. 원래 사용 목적 확인 (git history)
2. focusTrap-solid.ts와의 관계 확인
3. 미래 사용 계획 여부

**해결 방안 (우선순위)**:

1. **제거** (1순위) - 사용처 없고 focusTrap으로 충분하면
2. **통합** (2순위) - focusTrap과 병합 가능하면
3. **유지** (3순위) - 명확한 사용 계획이 있으면 (문서화 필요)

**수용 기준**:

- [ ] dependency-cruiser orphan 경고 0건
- [ ] 제거 시: 빌드/테스트 GREEN 유지
- [ ] 유지 시: 사용 목적 문서화 및 예시 코드 추가

#### 10.3: TODO 주석 해결 🔴 **높은 우선순위**

**파일**:
`src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`

**TODO 항목 (3곳)**:

1. Line 70:
   `const [isHelpOpen, setIsHelpOpen] = createSignal(false); // TODO: KeyboardHelpOverlay Solid 버전 필요`
2. Line 261: `// TODO: '?' 키로 KeyboardHelpOverlay 열기 (Solid 버전 필요)`
3. Line 430: `{/* 키보드 도움말 오버레이 - TODO: Solid 버전 필요 */}`

**현재 상태**:

- KeyboardHelpOverlay가 Preact 버전으로 남아있음 (추정)
- 또는 완전히 제거됨 (확인 필요)

**작업 옵션**:

1. **KeyboardHelpOverlay Solid 버전 구현** (Phase 10.3a)
   - Phase 5 패턴 적용 (Preact → Solid)
   - createSignal, createEffect, Show 사용
   - 키보드 단축키 표시 UI

2. **기능 제거** (Phase 10.3b) - 더 간단
   - TODO 주석 및 관련 코드 제거
   - 키보드 네비게이션은 이미 Phase 7에서 완료
   - Help overlay는 선택적 기능

**권장**: Option 2 (제거) - 코드 복잡도 감소, 핵심 기능 영향 없음

**수용 기준**:

- [ ] TODO 주석 0건
- [ ] 구현 시: 키보드 단축키 표시 정상 작동
- [ ] 제거 시: 관련 코드 완전 제거
- [ ] 테스트 추가 또는 수정

### Phase 10 예상 메트릭

| 메트릭      | Phase 9     | Phase 10 예상 | 변화        |
| ----------- | ----------- | ------------- | ----------- |
| Dev 빌드    | 1,029.96 KB | ~1,025 KB     | **-5 KB**   |
| Prod 빌드   | 330.73 KB   | ~330 KB       | 유지        |
| gzip        | 88.35 KB    | ~88 KB        | 유지        |
| Orphan 모듈 | 1           | **0**         | **-1** ✅   |
| 테스트 파일 | 기존        | 5개 제거      | **정리** ✅ |
| TODO 주석   | 3           | **0**         | **-3** ✅   |

### 작업 순서

1. **RED**: orphan 모듈, TODO 주석 탐지 테스트 작성
2. **10.2 실행**: focusScope-solid.ts 처리 (조사 → 결정 → 실행)
3. **10.3 실행**: TODO 주석 해결 (제거 권장)
4. **10.1 실행**: 테스트 Preact 잔재 제거
5. **GREEN**: 전체 테스트 통과 확인
6. **REFACTOR**: 테스트 구조 개선 (필요 시)

---

## Phase 11: Deprecated 항목 정리 (계획) 🟡 **중간 우선순위**

### Phase 11 목표

실사용이 없는 deprecated 항목을 제거하여 코드 품질을 개선합니다. 단, 실제로 사용
중인 항목은 유지합니다.

### Phase 11 작업 범위

#### 11.1: 완전 미사용 Deprecated 파일 제거

**제거 대상**:

1. `src/shared/components/ui/Toolbar/toolbarConfig.ts` (전체 파일 deprecated,
   테스트 전용)
2. `src/shared/dom/DOMEventManager.ts` (UnifiedEventManager로 대체됨)
3. `src/shared/utils/events.ts` EventManager 클래스 (내부 호환 용도로
   표시되었으나 실사용 확인 필요)

**조사 항목**:

- 각 파일의 실제 참조 확인 (grep 검색)
- 테스트에서만 사용되는지 확인
- 제거 시 영향 범위 분석

**수용 기준**:

- [ ] 실사용 없는 deprecated 파일 0건
- [ ] 빌드/테스트 GREEN 유지
- [ ] 린트 경고 감소

#### 11.2: Deprecated Props/Methods 정리

**검토 대상**:

1. `Button.tsx` - `variant` prop (intent로 대체됨)
2. `ServiceManager.getDiagnostics()` - 실사용 중이므로 **유지**
3. `BrowserService.getDiagnostics()` - 실사용 중이므로 **유지**
4. `UnifiedToastManager` 레거시 export - 하위 호환성으로 **유지**

**작업**:

- variant prop: 마이그레이션 가이드 작성 후 제거
- getDiagnostics: deprecated 태그 제거 (정상 API로 인정)

**수용 기준**:

- [ ] 사용되지 않는 deprecated props 0건
- [ ] 마이그레이션 가이드 문서화
- [ ] 실사용 API는 deprecated 태그 제거

### Phase 11 예상 메트릭

| 메트릭          | Phase 10  | Phase 11 예상 | 변화        |
| --------------- | --------- | ------------- | ----------- |
| Dev 빌드        | ~1,025 KB | ~1,020 KB     | **-5 KB**   |
| Deprecated 파일 | 3         | **0-1**       | **정리** ✅ |
| 코드 복잡도     | 중간      | **낮음**      | **개선** ✅ |

---

## Phase 12: 성능 최적화 및 문서 갱신 (계획) 🟢 **낮은 우선순위**

### Phase 12 목표

Solid.js 반응성 시스템을 더욱 효율적으로 활용하고 프로젝트 문서를 최신 상태로
갱신합니다.

### Phase 12 작업 범위

#### 12.1: createEffect 패턴 최적화

**검토 대상**:

1. `signalOptimization.ts` - `untrack()` 사용 패턴
2. `createAsyncSelector` - generation 추적 패턴
3. 불필요한 createEffect → createMemo 전환 가능 영역

**작업**:

- 부수효과 없는 effect를 memo로 전환
- untrack 사용이 정말 필요한지 검토
- batch 사용으로 업데이트 최소화

**수용 기준**:

- [ ] 성능 벤치마크 개선 (Vitest performance project)
- [ ] createEffect 사용 횟수 최적화
- [ ] 불필요한 재계산 제거

#### 12.2: 테스트 구조 개선

**작업**:

1. Solid 테스트 패턴 일관화
2. 중복 테스트 제거
3. 테스트 속도 개선 (현재 20s timeout)

**수용 기준**:

- [ ] 테스트 실행 시간 감소
- [ ] 테스트 코드 중복 제거
- [ ] 일관된 테스트 패턴 적용

#### 12.3: 문서 갱신

**대상 문서**:

1. `ARCHITECTURE.md` - Solid.js 아키텍처 반영
2. `CODING_GUIDELINES.md` - Solid 패턴 가이드 강화
3. `TDD_REFACTORING_PLAN_COMPLETED.md` - Phase 10-11 이관
4. `AGENTS.md` - 현재 상태 업데이트

**작업**:

- 과도하게 긴 문서 재작성 (COMPLETED.md 6,600줄 → 필요 내용만)
- Solid.js 베스트 프랙티스 추가
- 예시 코드 업데이트

**수용 기준**:

- [ ] 모든 문서가 현재 상태 반영
- [ ] COMPLETED.md 길이 50% 감소
- [ ] 실용적인 예시 코드 포함

### Phase 12 예상 메트릭

| 메트릭            | Phase 11 | Phase 12 예상 | 변화        |
| ----------------- | -------- | ------------- | ----------- |
| createEffect 사용 | 기존     | 최적화        | **개선** ✅ |
| 테스트 시간       | 기존     | 단축          | **개선** ✅ |
| 문서 길이         | 6,600줄  | ~3,000줄      | **-50%** ✅ |

---

## 개발 원칙 (Development Principles)

1. **TDD 엄수**: RED → GREEN → REFACTOR
2. **PC 전용**: 터치/포인터 이벤트 금지
3. **디자인 토큰**: 하드코딩 색상 금지 (`--xeg-*` 토큰만)
4. **Vendor getter**: Solid.js, heroicons 직접 import 금지 ✅ **Phase 9에서
   완료**
5. **문서 동기화**: 작업 완료 시 COMPLETED.md 이관
