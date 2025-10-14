# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-15 | **상태**: 안정화 단계 ✅

## 프로젝트 현황

- **빌드**: prod **317.41 KB / 325 KB** (7.59 KB 여유, 2.3%) ✅
- **테스트**: **775 passing**, 9 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (257 modules, 712 dependencies) ✅

## 현재 상태: 안정화 및 유지보수 모드 ✅

**최근 완료**:

- Phase 72: 코드 품질 개선 - 하드코딩 제거 ✅ (2025-10-15)
  - semantic 디자인 토큰 추가 (`--shadow-inset-border`)
  - Button.module.css 하드코딩 제거 완료
  - 빌드 크기: 317.41 KB (안정)

- Phase 71: 문서 최적화 및 간소화 ✅ (2025-01-25)
  - ARCHITECTURE.md 중복 제거 (81줄 → 69줄, -15%)
  - 문서 역할 명확화 및 단일 정보 출처 확립

**백로그**: 번들 최적화 및 테스트 개선

**결정 근거**:

- 모든 핵심 Phase 완료 (Phase 33, 67, 69, 71, 72)
- 기능 안정화 완료, 번들 크기 예산 충분 (2.3% 여유)
- 백로그 항목들은 트리거 조건 달성 시 활성화

---

## Phase 73: 번들 최적화 재평가 (백로그)

**상태**: 대기 (번들 322 KB 도달 시 활성화)

### 트리거 조건

- 프로덕션 빌드 **322 KB (99%)** 도달

### 후보 작업

| 항목              | 예상 효과 | 시간  | ROI | 우선순위 |
| ----------------- | --------- | ----- | --- | -------- |
| Toolbar.tsx 분할  | ~4-5 KB   | 2-3일 | 0.7 | 중간     |
| Lazy Loading 확장 | ~5 KB     | 1-2일 | 0.8 | 중간     |
| CSS 토큰 정리     | ~1-2 KB   | 2-3h  | 0.4 | 낮음     |
| events.ts 재검토  | ~2-3 KB   | 1일   | 0.3 | 낮음     |

**총 예상 효과**: ~10-13 KB 절감

---

## Phase 74: Skipped 테스트 재활성화 (백로그)

**상태**: 대기 (선택적 활성화)

### 현재 Skipped 테스트 현황

- **총 9개**: 1개 E2E 이관 + 8개 debounce 타이밍 조정 필요
- **테스트 통과율**: 98.8% (775/784)
- **기능 상태**: 모두 정상 작동 중

### 테스트 분류

1. **E2E 이관 (1개)**: `toolbar-layout-stability.test.tsx:80`
   - 이유: JSDOM에서 Solid.js Signal 기반 `data-expanded` 속성 미작동
   - 상태: `playwright/smoke/toolbar-settings.spec.ts`에서 검증 중
   - 조치: skip 유지 (정당한 이유)

2. **Debounce 타이밍 조정 필요 (8개)**:
   - `use-gallery-focus-tracker-deduplication.test.ts`: 1개
   - `use-gallery-focus-tracker-events.test.ts`: 3개
   - `use-gallery-focus-tracker-global-sync.test.ts`: 4개
   - 이유: Phase 69 debounce 도입 후 `vi.useFakeTimers()` 타이밍 불일치
   - 예상 시간: 2-3시간

### 활성화 조건

- 테스트 통과율 95% 미만 시 즉시 검토
- 또는 focus tracker 기능 변경 시 함께 수정

---

## 모니터링 지표

### 경계 조건

- **번들 크기**: 322 KB (99%) 도달 시 Phase 73 활성화
- **테스트 skipped**: 15개 이상 시 즉시 검토
- **테스트 통과율**: 95% 미만 시 Phase 74 활성화
- **빌드 시간**: 60초 초과 시 최적화 검토
- **문서 크기**: 개별 문서 800줄 초과 시 분할 검토

### 주기별 점검

- **주간**: 번들 크기, 테스트 통과율, skipped 수
- **월간**: 의존성 업데이트, 문서 최신성, 보안 취약점
- **분기**: 아키텍처 리뷰, 성능 벤치마크

---

## 참고 문서

- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md):
  완료된 Phase 기록 (33, 67, 69)
- [AGENTS.md](../AGENTS.md): 개발 워크플로
- [ARCHITECTURE.md](./ARCHITECTURE.md): 3계층 구조
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md): 코딩 규칙
- [MAINTENANCE.md](./MAINTENANCE.md): 유지보수 체크리스트

---

## 히스토리

- **2025-10-15**: Phase 71, 72 계획 수립 (문서 최적화 + 코드 품질)
- **2025-10-14**: Phase 33, 67, 69 완료 → 유지보수 모드 전환
- **2025-10-13**: Phase 67 번들 최적화 1차 완료 (319 KB 달성)
- **2025-10-12**: Phase 69 성능 개선 완료
