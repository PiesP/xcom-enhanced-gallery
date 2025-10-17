# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-17 | **상태**: Phase 93 완료 ✅

## 프로젝트 현황

### 빌드 및 품질 지표

- **빌드**: 330.23 KB / 335 KB (4.77 KB 여유, 98.6%) ⚠️
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings, Markdown 0 errors ✅
- **CSS 린트**: stylelint 0 warnings ✅
- **CodeQL**: 5/5 쿼리 통과, 병렬 실행 29.5초 ✅
- **의존성**: 0 violations (263 modules, 736 dependencies) ✅

### 테스트 현황

- **단위 테스트**: 1018 passing / 10 skipped (99.0% 통과율) ✅
- **E2E 테스트**: 28 passed / 1 skipped (96.6% 통과율) ✅
- **커버리지**: v8로 통일 완료 ✅

### 코드 품질

- **로깅 일관성**: console 직접 사용 0건 (logger.ts 경유) ✅
- **디자인 토큰**: px 하드코딩 0개, rgba 0개, oklch 전용 ✅
- **브라우저 지원**: Safari 14+, Chrome 110+ (OKLCH 폴백 적용) ✅

---

## 현재 상태: Phase 93 완료 ✅

**최근 완료**: Phase 93 - TDD_REFACTORING_PLAN_COMPLETED.md 간소화 (2025-10-17)

- ✅ 문서 간소화: 1334줄 → 242줄 (81.9% 감소)
- ✅ 중복 헤더 제거 (20줄)
- ✅ Phase 92, 91, 90만 상세 기록 유지
- ✅ Phase 60-89를 요약 테이블로 압축 (37개 Phase → 3개 테이블)
- ✅ 전체 프로젝트 누적 메트릭 요약 추가
- ✅ Markdown lint 0 errors

**Phase 92 완료** (2025-10-17):

- ✅ CI/문서 린트 수정: Markdown 린트 오류 10개 → 0개 (100% 해결)
- ✅ CI Pipeline 블로커 해결
- ✅ CodeQL 보안 알림 분석 (코드베이스 문제 없음 확인)
- ✅ 자동 수정 스크립트 추가 (`scripts/fix-markdown-lint.py`)

**Phase 91 완료** (2025-10-17):

- ✅ 문서/스크립트 정리
- ✅ README.md 키보드 단축키 섹션 명확화
- ✅ 불필요한 스크립트 제거 (`validate-metadata.js`)
- ✅ .gitignore 정리 (빌드 산출물 패턴 추가)

---

## 프로젝트 안정화 완료 ✅

모든 주요 개선 영역이 완료되었습니다:

### 1. 코드 품질 영역 ✅

- ✅ **Phase 78 시리즈**: 디자인 토큰 통일 (px 0개, rgba 0개, oklch 전용)
- ✅ **Phase 84**: 로깅 일관성 (console 직접 사용 0건)
- ✅ **Phase 86**: Deprecated 코드 제거 (~420줄 레거시 코드 정리)

### 2. 테스트 영역 ✅

- ✅ **Phase 74-75**: Skipped 테스트 재활성화, test:coverage 수정
- ✅ **Phase 82.3**: 키보드 네비게이션 E2E 테스트 (4개)
- ✅ **Phase 82.7**: 키보드 비디오 컨트롤 E2E 테스트 (3개)
- ✅ **Phase 82.5**: JSDOM 테스트 정리 완료

### 3. 성능 영역 ✅

- ✅ **Phase 83**: 포커스 안정성 개선 (StabilityDetector 기반)
- ✅ **Phase 85.2**: CodeQL 병렬 실행 최적화 (90-100초 → 29.5초)
- ✅ **Phase 87**: Toolbar Solid.js 최적화 (핸들러 재생성 9개 → 0개)

### 4. 문서 영역 ✅

- ✅ **Phase 90**: TDD_REFACTORING_PLAN_COMPLETED.md 간소화
- ✅ **Phase 92**: CI/문서 린트 수정
- ✅ **Phase 93**: TDD_REFACTORING_PLAN_COMPLETED.md 추가 간소화 (81.9% 감소)

### 5. 번들 분석 ✅

- ✅ **Phase 88**: 번들 분석 완료 (rollup-plugin-visualizer)
- ✅ **Phase 89**: events.ts 리팩토링 (코드 품질 향상)
- ⚠️ 교훈: Terser 압축으로 소스 최적화 효과 제한적

---

## 다음 작업 방향

### Option 1: 유지 관리 모드 (권장) ✅

**목적**: 현재 안정적인 상태 유지

**활동**:

- 사용자 피드백 모니터링
- 버그 리포트 대응
- 의존성 보안 업데이트
- 정기 유지보수 점검 (`npm run maintenance:check`)

**장점**: 위험 없음, 품질 유지, 안정적 운영 **단점**: 새로운 기능 없음

**권장 이유**: 현재 프로젝트는 매우 안정적이고 모든 품질 지표가 우수합니다.
사용자 피드백을 기다리며 필요시 대응하는 것이 가장 실용적입니다.

### Option 2: 테스트 커버리지 향상

**목적**: 코드 품질 추가 개선

**활동**:

- 커버리지 낮은 모듈 테스트 추가
- Edge case 테스트 보강
- Skipped 10개 재검토

**장점**: 코드 안정성 향상 **단점**: 즉각적인 사용자 가치 낮음, Phase 82
시리즈에서 E2E 이관 제약 확인

### Option 3: E2E 테스트 연구 (장기 보류)

**목적**: Skipped 10개 해결 방법 연구

**현황**:

- Phase 82.5/82.6에서 하네스 패턴 제약 확인
- Solid.js 반응성 트리거 실패 이슈
- 현재 E2E 이관 가능한 케이스 대부분 완료

**활동**:

- page API 패턴 연구 (Phase 82 제약 극복)
- Solid.js 반응성 트리거 방법 탐색

**장점**: 장기적 테스트 품질 향상 **단점**: 시간 소요, 성공 불확실

### Option 4: 사용자 가치 기반 기능 추가

**목적**: 사용자 경험 개선

**활동**:

- 사용자 피드백 기반 새 기능
- UX 개선

**장점**: 직접적인 사용자 가치 **단점**: 빌드 크기 한도 고려 필요 (현재 4.77 KB
여유)

---

## 모니터링 지표

### 경계 조건

- **번들 크기**: 335 KB 한도 (현재 330.23 KB, 4.77 KB 여유)
- **테스트 skipped**: 20개 이상 시 즉시 검토 (현재 11개: 단위 10개 + E2E 1개)
- **테스트 통과율**: 95% 미만 시 재검토 (현재 99.0% / 96.6%)
- **빌드 시간**: 60초 초과 시 최적화 검토 (현재 ~30초)
- **문서 크기**: 개별 문서 500줄 초과 시 간소화 검토

### 주기별 점검

**주간**:

- 번들 크기 확인
- 테스트 통과율 확인
- Skipped 테스트 수 모니터링

**월간**:

- 의존성 보안 업데이트 (`npm audit`)
- 문서 최신성 검토
- `npm run maintenance:check` 실행

**분기**:

- 아키텍처 리뷰
- 성능 벤치마크
- 사용자 피드백 분석

---

## 보류 Phase

### Phase 91 (번들 최적화) - 보류

**상태**: Phase 89 교훈으로 효과 불확실, 필요시 재검토

**Phase 89 교훈**:

- events.ts 리팩토링 (848줄 → 834줄, -708 bytes 소스)
- 빌드 크기: 330.24 KB 유지 (Terser 압축 효과로 변화 없음)
- 결론: 작은 모듈 리팩토링은 빌드 크기 효과 미미

**Phase 73 교훈**:

- TwitterAPIExtractor lazy loading 시도 → 실패 (+360 bytes)
- 단일 파일 번들 환경에서 code splitting 효과 없음
- 결론: 데이터 기반 접근 필요 (Phase 88 번들 분석 활용)

**재평가 필요**:

- useGalleryFocusTracker.ts (12.86 KB) 최적화 효과 불확실
- 실제 효과 측정 후 진행 여부 결정

### Phase 82.9+ (E2E 완료) - 장기 보류

**상태**: 기술적 제약으로 별도 연구 필요

**Phase 82 시리즈 결과**:

- ✅ 키보드 네비게이션 4개 완료 (Phase 82.3)
- ✅ 키보드 비디오 컨트롤 3개 완료 (Phase 82.7)
- ✅ JSDOM 정리 완료 (Phase 82.5)
- ⏸️ E2E 이관 보류 (Phase 82.6, 하네스 패턴 제약)

**제약 사항**:

- Solid.js 반응성 트리거 실패 (props update 미작동)
- 하네스 API의 한계 (remount 패턴으로만 우회 가능)
- 실제 FocusTracker 서비스 미초기화

**현재 Skipped 테스트**: 10개 (Focus Tracker 6개, icon-optimization 3개, toolbar
1개)

**결론**: 현재 E2E 이관 가능한 케이스 대부분 완료, 나머지는 page API 패턴 연구
후 재시도

---

## 참고 문서

- **[TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)**:
  완료된 Phase 상세 기록 (Phase 60-93)
- **[AGENTS.md](../AGENTS.md)**: 개발 워크플로우, 스크립트 사용법
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: 3계층 구조 (Features → Shared →
  External)
- **[CODING_GUIDELINES.md](./CODING_GUIDELINES.md)**: 코딩 규칙 (디자인 토큰, PC
  전용 이벤트, 벤더 getter)
- **[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)**: Testing Trophy, JSDOM
  제약사항, E2E 하네스 패턴
- **[MAINTENANCE.md](./MAINTENANCE.md)**: 유지보수 체크리스트, 정기 점검 항목

---

**유지보수 정책**: 이 문서는 활성 Phase만 포함하며, 완료된 Phase는 즉시
`TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다. 문서가 500줄을 초과하면
간소화를 검토합니다.
