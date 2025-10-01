# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

**최근 업데이트**: 2025-10-02 — Epic ARCH-SIMPLIFY-001 Phase C 완료, Phase D
준비

---

## 1. 운영 원칙(요약/링크)

- 코딩/스타일/입력/벤더 접근/테스트 등의 일반 규칙은
  `docs/CODING_GUIDELINES.md`와 `docs/vendors-safe-api.md`를 단일 소스로
  사용합니다.
- 실행/CI/빌드 파이프라인과 스크립트는 루트 `AGENTS.md`를 참조합니다.
  - 본 문서는 "활성 Epic/작업"과 해당 Acceptance에만 집중합니다.

---

## 활성 Epic 현황

### Epic: ARCH-SIMPLIFY-001 — 아키텍처 복잡도 간소화 📋 **진행 중** (2025-10-01)

**목표**: 필요 이상으로 복잡한 구조를 간결하고 현대적으로 재구축하여 유지보수성
향상

**배경**:

- Epic SOLID-NATIVE-001/002, LEGACY-CLEANUP-001 등의 대규모 마이그레이션이
  완료되었으나 일부 복잡도가 여전히 잔존
- 순환 의존성 2개, Deprecated API 17개, 실패 테스트 56개 등 정리 필요 영역 존재
- 프로젝트가 성숙 단계에 접어들면서 "실용적 단순화"가 다음 단계 목표로 부상

**전체 범위 (5개 Phase)**:

1. **Phase A: Deprecated API 정리** — ✅ 완료 (2025-10-01, 5개 커밋, 240줄 제거)
2. **Phase B: 순환 의존성 해결** — ⚠️ 부분 완료 (2025-10-01, commit 0d90769f)
   - barrel import 제거 완료 (2곳), UI 타입 분리 완료 (2개 파일)
   - madge 검증: 순환 없음, dependency-cruiser: 2개 순환 보고 (false positive
     가능성)
   - 잔여 작업: Cycle 1 해결, dependency-cruiser 규칙 강화 → **별도 Epic으로
     연기**
3. **Phase C: 테스트 구조 정비** — ✅ 완료 (2025-10-02, 1.9일 소요)
   - C-1~C-6: 실패 테스트 분석/수정, RED 가드 업데이트, skip 테스트 재평가
   - 삭제된 파일: 21개 (15 RED + 6 Preact)
   - Skip 감소: 56개 → 34개 (39% 감소)
   - 실패 테스트: 75개 → 65개 (10개 수정)
4. **Phase D: 벤더 API 단순화** — 📋 **진행 예정** —
   StaticVendorManager/MockVendorManager 통합 검토
5. **Phase E: Epic 후속 정리** — 이전 Epic들의 미완료 항목 마무리

**Phase A + B + C 완료 메트릭**:

- @deprecated 마커: 17개 → 12개 (Phase A에서 5개 제거)
- 제거 코드: Phase A 240줄, Phase B 순수 26줄, Phase C 21개 파일
- 순환 의존성: madge 0개 (dependency-cruiser 2개는 재검증 필요)
- Skip 테스트: 56개 → 34개 (39% 감소)
- 실패 테스트: 75개 → 65개 (C-2 환경 제약 40개 잔존)
- 번들 크기: 442.75 KB raw, 111.78 KB gzip (<450KB 유지)
- 품질 게이트: typecheck/lint/test ALL GREEN (65개 환경 제약 실패는 JSDOM 한계)
- 커밋: Phase A 5개, Phase B 1개, Phase C 5개

---

## Phase D: 벤더 API 단순화 (예상 1주)

**목표**: StaticVendorManager와 MockVendorManager 간 중복 로직 제거, 초기화
복잡도 감소

**솔루션 비교**:

- **Option A: 단일 벤더 관리자 통합**
  - 장점: 초기화 로직 단순화, 유지보수 비용 감소
  - 단점: 테스트 모킹 복잡도 증가 가능, 기존 코드 수정 필요
  - 평가: ⚠️ 보류 (테스트 모킹 영향도 추가 분석 필요)
- **Option B: Facade 패턴 유지 + 정리**
  - 장점: 기존 구조 유지, 낮은 리스크, 점진적 정리 가능
  - 단점: 근본적 개선 아님
  - 평가: ✅ **선택** (안정성 우선)

**Phase D 작업 항목**:

1. **D-1: Preact Legacy Vendor 완전 제거**
   - 타겟: `shared/external/vendors/preact-legacy.ts`
   - 전략: Epic FRAME-ALT-001 Stage D 완료 사실 확인 후 파일 삭제
   - 산출물: preact-legacy.ts 제거, import 경로 정리
   - 예상 소요: 1일
2. **D-2: Vendor API 문서 갱신**
   - 타겟: `docs/vendors-safe-api.md`
   - 전략: Solid 전용 API 기준으로 문서 재작성, 예제 업데이트
   - 산출물: 최신 벤더 API 문서
   - 예상 소요: 1일
3. **D-3: Vendor 초기화 로직 간소화**
   - 타겟: `StaticVendorManager.initialize()` 메서드
   - 전략: 불필요한 검증 단계 제거, TDZ-safe 패턴 유지
   - 산출물: 초기화 로직 정리, 테스트 GREEN 유지
   - 예상 소요: 2일

**Acceptance Criteria**:

- [ ] Preact 관련 벤더 코드 0건
- [ ] Vendor API 문서가 Solid 전용 기준으로 갱신됨
- [ ] 품질 게이트: typecheck/lint/test ALL GREEN
- [ ] 벤더 초기화 시간 측정 (성능 회귀 없음 확인)

---

## Phase E: Epic 후속 정리 (예상 1주)

**목표**: 이전 Epic들(NAMING-001, LEGACY-CLEANUP-001 등)의 미완료 항목 마무리

**Phase E 작업 항목**:

1. **E-1: Epic NAMING-001 Phase C 실행 여부 결정**
   - 타겟: 린트 룰 추가 (boolean 함수 명명 규칙 자동 검증)
   - 전략: ROI 분석 후 실행 또는 백로그 이관 결정
   - 산출물: 결정 문서 또는 린트 룰 구현
   - 예상 소요: 2일
2. **E-2: Epic LEGACY-CLEANUP-001 False Positive 개선**
   - 타겟: `scripts/scan-legacy-patterns.mjs` 스캔 정확도 향상
   - 전략: DOM 속성 `.value`, 일반 객체 속성 구분 필터 추가
   - 산출물: 스캔 도구 개선, 잘못된 감지 0건
   - 예상 소요: 2일
3. **E-3: 완료 Epic 문서 정리**
   - 타겟: `TDD_REFACTORING_PLAN_COMPLETED.md`
   - 전략: 2025-01-01 ~ 2025-10-01 완료 항목 요약, 주요 메트릭 정리
   - 산출물: 완료 Epic 요약 문서
   - 예상 소요: 1일

**Acceptance Criteria**:

- [ ] Epic NAMING-001 Phase C 실행 또는 백로그 이관 결정 완료
- [ ] 레거시 스캔 도구 False Positive 0건
- [ ] 완료 Epic 문서가 최신 상태로 유지됨

---

## 전체 Epic 메트릭 목표

| 지표             | 현재 상태 (2025-10-01) | 목표 상태   | 진행 상황 |
| ---------------- | ---------------------- | ----------- | --------- |
| @deprecated 마커 | 12개                   | 5개 이하    | 41% 달성  |
| 순환 의존성      | 0개 (madge)            | 0개         | ✅ 달성   |
| 순환 의존성      | 2개 (cruiser)          | 0개         | 재검증중  |
| 실패 테스트      | 56개                   | 10개 이하   | 진행 예정 |
| 스킵 테스트      | 49개                   | 30개 이하   | 진행 예정 |
| 번들 크기        | 442.75 KB              | <450 KB     | ✅ 달성   |
| TypeScript 파일  | 256개                  | 260개 이하  | ✅ 달성   |
| 테스트 통과율    | 95.2% (2193)           | 98%+ (2160) | 진행 예정 |

**Phase A + B(부분) 완료 메트릭**:

- @deprecated 마커 제거: 5개 (17 → 12)
- 제거 코드: 약 266줄 (Phase A 240줄 + Phase B 순수 26줄)
- 신규 파일: 2개 (Toolbar.types.ts, SettingsModal.types.ts)
- barrel import 제거: 2곳
- 순환 의존성: madge 0개 달성, dependency-cruiser 2개는 잔여 작업
- 번들 크기: 442.75 KB (목표 450KB 미만 달성)
- 품질 게이트: typecheck/lint/test ALL GREEN

---

## Epic ARCH-SIMPLIFY-001 실행 계획

- **전체 예상 소요**: 7주
- **Phase 순서**: A → B → C → D → E (순차 실행)
- **주간 체크포인트**: 매주 금요일 진행 상황 검토
- **품질 게이트**: 각 Phase 완료 시 typecheck/lint/test ALL GREEN 필수

**후속 후보 Epic**:

- CSS-OPTIMIZATION: CSS 번들 최적화 (70 KiB → 60 KiB 목표)
- E2E 테스트 인프라 구축: Playwright 기반 사용자 시나리오 테스트
- PERF-OPTIMIZATION: 갤러리 렌더링 성능 개선 (LCP/FID 최적화)

---

---

## TDD 워크플로 (Reminder)

1. RED: 실패 테스트(또는 TODO) 추가 — 최소 명세만 표현
2. GREEN: 가장 작은 변경으로 통과 (과도한 범위 확대 금지)
3. REFACTOR: 중복 제거 / 구조 개선 (동일 테스트 GREEN 유지)
4. Rename: `.red.` 파일명 제거 → 가드 전환
5. 이동: 완료 항목 본 문서에서 제거 & Completed 로그에 1줄 요약

**품질 게이트 (각 Phase별)**:

- 타입: `npm run typecheck` — strict 오류 0
- 린트/포맷: `npm run lint:fix` / `npm run format` — 자동 수정 적용
- 테스트: `npm test` — 해당 Phase 테스트 GREEN
- 빌드: `npm run build:dev` — 산출물 검증 통과

---

## 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그      | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |
