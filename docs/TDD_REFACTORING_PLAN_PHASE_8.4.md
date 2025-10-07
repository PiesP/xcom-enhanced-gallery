# Phase 8.4: Deprecated/Legacy 코드 정리 계획

> **작성일**: 2025-01-07  
> **목표**: 소스 코드 및 개발 문서에서 deprecated/legacy/중복 구현 제거

## 배경

Phase 8.1-8.3에서 preact/fflate 잔재를 제거했으나, 전체 코드베이스에 여전히
다음이 존재:

1. **Deprecated 유틸리티**: `memoization.ts` (Solid.js 네이티브 최적화로 불필요)
2. **Deprecated 클래스**: `events.ts`의 `EventManager` 클래스 (@deprecated 주석
   있음)
3. **Legacy 정규화**: Twitter API legacy 필드 정규화 (현재도 필요한지 검증 필요)
4. **Deprecated 래퍼**: `MediaService.ts`의 다운로드 메서드 (@deprecated -
   위임만 함)
5. **문서 중복**: 여러 문서에 반복되는 내용 및 과도하게 긴 문서

## Phase 8.4 작업 단계

### 8.4.1: @deprecated 코드 실사용 검증 및 제거 (HIGH 우선순위)

**대상 파일**:

- `src/shared/utils/performance/memoization.ts`
- `src/shared/utils/events.ts` (EventManager 클래스)
- `src/shared/services/MediaService.ts` (downloadImage, downloadVideo 래퍼)
- `src/shared/services/ServiceManager.ts` (getServiceStatus 메서드)

**수용 기준**:

- [ ] 각 @deprecated 심볼의 사용처 검색 (`src/**` 내)
- [ ] 사용처가 0건이면 → 완전 제거 + 테스트 제거
- [ ] 사용처가 있으면 → 사용처를 새 API로 마이그레이션 후 제거
- [ ] 빌드 크기 변화 확인 (Prod 329 KB 유지 또는 감소)

**기대 효과**:

- 코드베이스 단순화
- 번들 크기 감소 가능성
- 개발자 혼란 방지 (deprecated API 제거)

---

### 8.4.2: Legacy Twitter 정규화 필요성 검증 (MEDIUM 우선순위)

**대상 파일**:

- `src/shared/services/media/normalizers/legacy/twitter.ts`
- `src/shared/services/media/TwitterVideoExtractor.ts`

**수용 기준**:

- [ ] 현재 Twitter API 응답에 `legacy` 필드가 실제로 존재하는지 확인
- [ ] 존재한다면 → 유지 (필수 기능)
- [ ] 존재하지 않는다면 → 테스트와 함께 제거
- [ ] 또는 fallback으로만 유지하고 주요 경로에서 제거

**조사 방법**:

1. Twitter GraphQL 응답 샘플 확인
2. 브라우저 Network 탭에서 실제 API 응답 분석
3. 필요 시 조건부 정규화로 변경

---

### 8.4.3: 문서 간소화 및 중복 제거 (MEDIUM 우선순위)

**대상 문서**:

- `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (6177줄 → 너무 김)
- `docs/ARCHITECTURE.md`
- `docs/CODING_GUIDELINES.md`
- `AGENTS.md`

**수용 기준**:

- [ ] COMPLETED.md를 연도별/주요 Phase별로 섹션 분리 또는 요약
- [ ] ARCHITECTURE.md와 CODING_GUIDELINES.md 간 중복 제거
- [ ] 각 문서는 2000줄 이하로 유지
- [ ] 상호 참조를 명확히 하여 중복 서술 방지

**기대 효과**:

- 문서 탐색 속도 향상
- 신규 개발자 온보딩 시간 단축
- 유지보수 부담 감소

---

### 8.4.4: 빌드 산출물 검증 및 최종 정리 (LOW 우선순위)

**작업**:

- 개발용 빌드 (`npm run build:dev`) 검증
- 프로덕션 빌드 (`npm run build:prod`) 검증
- 예상치 못한 legacy 코드 잔재 검색
- Source map 확인하여 불필요한 코드 발견

**수용 기준**:

- [ ] Dev/Prod 빌드 모두 성공
- [ ] 빌드 크기: Dev ≤ 1,050 KB, Prod ≤ 330 KB
- [ ] gzip 크기: ≤ 90 KB
- [ ] Source map에서 "preact", "fflate" 문자열 0건

---

## 작업 우선순위

1. **HIGH**: 8.4.1 (deprecated 코드 제거) - 코드 품질 직접 개선
2. **MEDIUM**: 8.4.2 (legacy 정규화 검증) - 불필요한 코드 제거 가능
3. **MEDIUM**: 8.4.3 (문서 간소화) - 개발자 경험 개선
4. **LOW**: 8.4.4 (빌드 검증) - 최종 확인

## TDD 워크플로

각 작업은 RED → GREEN → REFACTOR 순서:

1. **RED**: deprecated 사용 검색 테스트 작성 (실패해야 함)
2. **GREEN**: 사용처 마이그레이션 또는 완전 제거
3. **REFACTOR**: 코드 정리 및 테스트 갱신

## 완료 기준

- [ ] 모든 @deprecated 심볼 제거 또는 마이그레이션
- [ ] `npm run build` 성공 (Dev + Prod)
- [ ] `npm test` 전체 통과
- [ ] 문서가 2000줄 이하로 간소화
- [ ] COMPLETED.md에 Phase 8.4 기록 추가
- [ ] PLAN.md에서 Phase 8.4 제거
