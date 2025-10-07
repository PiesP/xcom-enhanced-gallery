# TDD-driven Refactoring Plan (xcom-enhanced-gallery)

> **Last updated**: 2025-01-25 **Status**: Phase 7 Completed - Ready for New
> Features

## Overview

모든 Phase는 **RED → GREEN → REFACTOR** 사이클로 진행됩니다. 테스트를 먼저
작성하고, 최소 구현으로 GREEN을 달성한 뒤, 품질을 개선합니다.

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

## Phase 8: Preact/fflate 잔재 제거

### 배경

Phase 1-6에서 Preact에서 Solid.js로 마이그레이션하고 fflate를 제거했지만,
코드베이스에 다음과 같은 잔재가 남아있습니다:

1. **vendor-api-safe.ts**: preact 관련 상태 확인 함수들
2. **주석**: 여러 파일에 preact/fflate 언급
3. **테스트 mock**: 사용되지 않는 preact/fflate mock 코드
4. **빌드 산출물**: preact 관련 코드 포함

### Phase 8.1: vendor-api-safe 정리 (우선순위: 높음)

**목표**: preact 관련 함수 제거 및 Solid.js 중심으로 재구성

**작업**:

- [ ] `getVendorStatusesSafe()` 함수에서 preact 관련 코드 제거
- [ ] `isVendorInitializedSafe()` 함수에서 preact case 제거
- [ ] totalCount 주석 수정 (preact 제거 후 실제 개수 반영)
- [ ] 테스트 작성: vendor-api-safe.test.ts 수정/추가
- [ ] 빌드 및 전체 테스트 실행

**예상 결과**: vendor-api-safe.ts가 Solid.js만 지원하는 깔끔한 코드로 변경

### Phase 8.2: 주석 정리 (우선순위: 중간)

**목표**: 혼란을 야기하는 preact/fflate 주석 제거 또는 간소화

**작업**:

- [ ] "Preact에서 마이그레이션됨" 형태로 간소화 (역사적 맥락 유지)
- [ ] "Preact 권장", "Preact 호환" 등 현재 상태와 맞지 않는 주석 제거
- [ ] fflate 관련 주석 제거 (zip-creator.ts 등)

**대상 파일**:

- UnifiedToastManager.ts
- signalSelector.ts
- signalOptimization.ts
- memoization.ts
- app.types.ts
- primitives/\*.ts
- signal-factory-solid.ts
- 기타 signal 파일들

### Phase 8.3: 테스트 mock 정리 (우선순위: 중간)

**목표**: 사용되지 않는 preact/fflate mock 제거

**작업**:

- [ ] vendor.mock.ts, vendor.mock.js, vendor-mock-clean.js 분석
- [ ] 실제 사용되는 mock 확인 (grep으로 참조 검색)
- [ ] 사용되지 않는 mock 파일 제거
- [ ] 사용되는 mock은 preact/fflate 부분만 제거
- [ ] 테스트 실행으로 영향 확인

### Phase 8.4: 문서 갱신 (우선순위: 높음)

**목표**: 프로젝트 문서를 현재 상태에 맞게 갱신

**작업**:

- [ ] ARCHITECTURE.md: preact 언급 제거, Solid.js 중심으로 재작성
- [ ] CODING_GUIDELINES.md: preact 규칙 제거 (필요시)
- [ ] README.md: 기술 스택 확인 및 갱신
- [ ] TDD_REFACTORING_PLAN_COMPLETED.md: Phase 8 작업 이관

---

## 다음 단계 (Next Phase)

Phase 8 완료 후:

### 옵션 1: 사용자 피드백 수집

- 실제 사용자 피드백 기반 개선 사항 도출
- Phase 7.3-7.5 우선순위 재조정
- A/B 테스트 또는 사용성 테스트 진행

### 옵션 2: 새로운 기능 개발

- 비디오 지원 (현재 이미지만 지원)
- 고급 필터/정렬 기능
- 커스텀 테마 시스템

### 옵션 3: 코드 품질 개선

- 테스트 커버리지 95%+ 목표
- 성능 프로파일링 (실제 데이터 기반)
- 문서 개선 (사용자 가이드, API 문서)

---

## 개발 원칙 (Development Principles)

1. **TDD 엄수**: RED → GREEN → REFACTOR
2. **PC 전용**: 터치/포인터 이벤트 금지
3. **디자인 토큰**: 하드코딩 색상 금지 (`--xeg-*` 토큰만)
4. **Vendor getter**: Solid.js, heroicons 직접 import 금지
5. **문서 동기화**: 작업 완료 시 COMPLETED.md 이관
