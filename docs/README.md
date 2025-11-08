# X.com Enhanced Gallery - Documentation Hub

**프로젝트 버전**: v0.4.2 | **마지막 업데이트**: 2025-11-08

---

## 📚 핵심 문서

### 🏗️ 아키텍처 및 설계

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** (67KB)
  - 프로젝트 3계층 구조 (Features, Shared, Styles)
  - Service Layer 패턴 (Phase 309+)
  - Constants 시스템 및 i18n 구조
  - Download Service 선택 가이드
  - Event System Modularization (Phase 329)
  - Quote Tweet Media Extraction (Phase 342)
  - Type System Optimization (Phase 353)
  - Settings Service Consolidation (Phase 354-360)
  - Unit Test Batched Execution (Phase 368)
  - **참조**: Copilot 지침, 코딩 가이드라인

### 📋 구현 계획

- **[IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)** (18KB)
  - 정적 분석 결과 요약
  - Phase별 구현 계획 및 우선순위
  - 파일명 중복 해결 방안
  - 타입 정의 정리 전략
  - 서비스 중복 통합 로드맵

### 🎓 테스트 및 리팩토링

- **[TDD_REFACTORING_PLAN.md](./TDD_REFACTORING_PLAN.md)** (30KB)
  - Test-Driven Development 전략 (Trophy)
  - 단위 테스트 레이아웃 및 배치 전략
  - 리팩토링 체크리스트
  - 성능 지표 및 메트릭스

---

## 🔍 Phase 가이드 및 마이그레이션

### Phase 340+ 완료 Phase

#### Media Extraction & Detection

- **[PHASE_342_MIGRATION_GUIDE.md](./PHASE_342_MIGRATION_GUIDE.md)** (7.9KB)
  - Quote Tweet Media Extraction
  - QuoteTweetDetector 통합
  - sourceLocation 추적 메커니즘
  - 타입 시스템 확장

#### SPA Scroll Recovery & Optimization

- **[PHASE_415_COMPLETION_REPORT.md](./PHASE_415_COMPLETION_REPORT.md)** (16KB)
  - SPA 스크롤 간섭 완화 (Phase 415)
  - Focus preventScroll, Popstate, MutationObserver 최적화
  - Solid.js reactive 상태 추적

- **[PHASE_415_FINAL_SUMMARY.md](./PHASE_415_FINAL_SUMMARY.md)** (14KB)
  - Phase 415 최종 요약 및 통계
  - 성능 개선 지표
  - 빌드 검증 결과

#### Logger Strategy

- **[PHASE_426_FINAL_COMPLETION_SUMMARY.md](./PHASE_426_FINAL_COMPLETION_SUMMARY.md)**
  (6.8KB)
  - Logger 전략 및 구현 완료
  - 코드 최적화 결과

### 프로젝트 완료 보고서

- **[FINAL_COMPLETION_REPORT.md](./FINAL_COMPLETION_REPORT.md)** (7.2KB)
  - 정적 분석 완료 상태
  - Phase 353+ 구현 진행 상황
  - 작업 계획 및 다음 단계

---

## 📖 빠른 참조

### 문서 선택 가이드

| 목적                    | 문서 추천                      | 크기  |
| ----------------------- | ------------------------------ | ----- |
| 프로젝트 구조 이해      | ARCHITECTURE.md                | 67KB  |
| 앞으로의 작업 계획 수립 | IMPLEMENTATION_ROADMAP.md      | 18KB  |
| 테스트 전략 학습        | TDD_REFACTORING_PLAN.md        | 30KB  |
| Quote Tweet 구현 참조   | PHASE_342_MIGRATION_GUIDE.md   | 7.9KB |
| 최근 완료된 작업 확인   | PHASE_415_COMPLETION_REPORT.md | 16KB  |

### 자주 찾는 주제

- **Service Layer 패턴**: ARCHITECTURE.md → "Tampermonkey Service Layer"
- **Event System**: ARCHITECTURE.md → "Phase 329: Event System Modularization"
- **i18n 시스템**: ARCHITECTURE.md → "Constants 시스템" → "Shared Constants"
- **다운로드 서비스**: ARCHITECTURE.md → "Download Service Selection Guide"
- **테스트 전략**: TDD_REFACTORING_PLAN.md → "Trophy 모델"
- **타입 시스템**: ARCHITECTURE.md → "Phase 353: Type System Optimization"

---

## 📦 아카이브 문서

완료된 Phase 분석, 중간 과정 보고서, 세션 요약 등은 `docs/archive/` 디렉토리에
보관됩니다.

- **분석 문서** (79개): Phase별 상세 분석, 진행 로그, 임시 검증 보고서
- **아카이브 범위**:
  - Phase 353-426 분석/진행 과정 문서
  - 중복 검증 보고서
  - 세션별 요약 및 로그
  - 빌드 아티팩트 분석

**아카이브 접근**: `docs/archive/` 디렉토리 확인 또는 Git History 참조

---

## 🔗 주요 링크

- **코드 가이드라인**: `.github/copilot-instructions.md`
- **프로젝트 구조**: `AGENTS.md`
- **언어 정책**: 코드 = English, 문서 = 한국어 (Korean)
- **버전 정보**: `package.json` 참조

---

## 📊 문서 통계

| 항목          | 값         |
| ------------- | ---------- |
| 활성 문서     | 8개        |
| 아카이브 문서 | 79개       |
| 총 크기       | ~180KB     |
| 마지막 정리   | 2025-11-08 |

---

## 🎯 다음 단계

1. **ARCHITECTURE.md** 검토: 현재 프로젝트 구조 및 패턴 이해
2. **IMPLEMENTATION_ROADMAP.md**: 향후 작업 계획 확인
3. **Phase 완료 보고서** 참조: 최근 구현 내용 검증
4. **TDD_REFACTORING_PLAN.md**: 테스트 전략 및 리팩토링 계획

---

**📝 문서 정책**: 수명이 끝난 문서는 `docs/archive/`로 이동되며, Git에서
제거되지 않습니다. 마지막 검증 일시: 2025-11-08 | 상태: ✅ 정리 완료
