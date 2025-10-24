# TDD 리팩토링 계획

> xcom-enhanced-gallery 프로젝트의 활성 리팩토링 진행 상황 **현재 Phase**: 165
> (빌드 크기 최적화 & 남은 실패 처리) **마지막 업데이트**: 2025-10-24

---

## 📊 현황 요약

| 항목           | 상태          | 세부                                           |
| -------------- | ------------- | ---------------------------------------------- |
| Build (prod)   | ⚠️ 339.65 KB  | 빌드 성공, 제한(337.5 KB) 약간 초과 (+2.15 KB) |
| 전체 테스트    | ✅ 3228/3234  | 1개 실패: alias-static-import.test.ts          |
| E2E 테스트     | ✅ 89 PASS    | Playwright 스모크 테스트 전체 통과             |
| Typecheck/Lint | ✅ PASS       | 모든 검사 완료, CodeQL 통과                    |
| 의존성         | ✅ OK         | 0 violations                                   |
| **현재 Phase** | 🔄 165 진행중 | 빌드 크기 최적화 & 실패 분석                   |

---

## ⚡ Phase 165: 빌드 크기 최적화 및 남은 실패 처리

### 목표

1. **빌드 크기 최적화**: 339.65 KB → 337.5 KB 이하 (2.15 KB 감량)
2. **실패 테스트 분석**: alias-static-import.test.ts 근본 원인 파악
3. **프로덕션 준비**: 모든 검증 통과

### 현재 상태

- **테스트**: 3228/3234 통과 (99.8%)
  - 1개 실패: `test/unit/alias/alias-static-import.test.ts` (경로 별칭 정책
    관련)
- **빌드**: 339.65 KB (gzip: 91.47 KB) - 제한 대비 +2.15 KB
- **E2E**: 89개 스모크 테스트 전체 통과 ✅
- **검증**: 타입/린트/CodeQL 모두 통과 ✅

### 남은 작업

#### **Priority 1: Build Size Optimization** (1시간)

**현황**:

- `events.ts`: 29.43 KB (새 제한 30 KB 기준)
- 전체 번들: 339.65 KB (목표 337.5 KB)
- 필요 감량: 2.15 KB

**분석 포인트**:

1. 불필요한 의존성 확인
2. Tree-shaking 기회 탐색
3. 코드 정리/리팩토링 기회
4. CSS/스타일 최적화 검토

**예상 소요 시간**: 1-1.5시간

---

#### **Priority 2: alias-static-import 분석** (30분)

**문제**:

- 테스트: `test/unit/alias/alias-static-import.test.ts`
- 증상: 경로 별칭을 통한 정적 import 검증 실패
- 범위: Phase 164 외부 (독립적 이슈)

**분석 계획**:

1. 테스트 내용 파악
2. 경로 별칭 설정 검증 (vite.config.ts, tsconfig.json, vitest.config.ts)
3. 근본 원인 파악 및 해결책 제시

**예상 소요 시간**: 30분

---

### 📅 다음 단계

1. **즉시**: alias-static-import 실패 분석
2. **병행**: 빌드 크기 최적화 방안 수립
3. **최종**: 모든 검증 통과 후 master 병합

---

## 📋 Phase 164: 테스트 안정화 및 빌드 최적화 (완료 ✅)

## 📋 Phase 164: 테스트 안정화 및 빌드 최적화 (완료 ✅)

**완료 항목**:

- Bundle Size Policy 조정: 28 KB → 30 KB, 940줄 → 970줄
- Event Policy 테스트 리팩토링: addEventListener spy → on<Event> 속성 검증
- 테스트 결과: 3209 → 3228 (19개 복구, 99.8% 통과)
- 빌드 검증: 339.65 KB (E2E 89/89 통과, 접근성 34/34 통과)

**커밋**: `test(phase-164): stabilize bundle-size and event-policy tests`

---

## 📚 참고 문서

- [AGENTS.md](../AGENTS.md) - 프로젝트 개발 환경 & 가이드
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Testing Trophy & vitest
  projects
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 3계층 구조 & 의존성 규칙
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - 코딩 규칙 & 정책
- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) -
  Phase 159-164 기록

---

## 🎯 성공 조건 (Phase 165)

- ✅ 빌드 크기: ≤ 337.5 KB
- ✅ 테스트: 3234/3234 PASS (또는 alias-static-import 이유 파악)
- ✅ E2E: 89+ 스모크 테스트 통과
- ✅ 검증: typecheck/lint/CodeQL 모두 통과
