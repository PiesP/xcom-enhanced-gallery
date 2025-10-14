# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-14 | **상태**: 유지 관리 모드 ✅

## 프로젝트 현황

- **빌드**: prod **317.30 KB / 325 KB** (7.70 KB 여유, 2.4%) ✅
- **테스트**: **775 passing**, 9 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (257 modules, 712 dependencies) ✅

## 현재 상태: 유지보수 모드 ✅

**결정 근거**:

- 번들 예산 2.4% 여유 충분 (향후 7.70 KB 추가 가능)
- Phase 33, 67, 69 완료로 모든 주요 최적화 목표 달성
- 추가 최적화 항목의 ROI 낮음 (< 1.0)

**활성 작업**: 없음

---

## 백로그 (장기 계획)

### Phase 70 최적화 후보

다음 항목은 번들 크기가 **322 KB (예산 99%)** 도달 시 재검토:

| 항목               | 예상 효과 | 시간   | ROI | 우선순위         |
| ------------------ | --------- | ------ | --- | ---------------- |
| Toolbar.tsx 분할   | ~4-5 KB   | 2-3일  | 0.7 | 중간             |
| Lazy Loading 확장  | ~5 KB     | 1-2일  | 0.8 | 중간 (UX 우려)   |
| CSS 토큰 정리      | ~1-2 KB   | 2-3h   | 0.4 | 낮음             |
| events.ts 리팩토링 | ~3-4 KB   | 1-2일  | 0.2 | 낮음 (이미 최적) |
| media-service 검토 | ~1-2 KB   | 0.5-1d | 0.3 | 매우 낮음        |

**총 예상 효과**: ~10-13 KB 절감 (목표: ~307 KB)

---

## 모니터링 지표

### 경계 조건

- **번들 크기**: 322 KB (99%) 도달 시 Phase 70 재검토
- **테스트 실패**: 5% 이상 증가 시 원인 분석
- **빌드 시간**: 60초 초과 시 최적화 검토

### 주기별 점검

- **주간**: 번들 크기, 테스트 통과율, 보안 취약점
- **월간**: 의존성 업데이트, 문서 최신성
- **분기**: 아키텍처 리뷰, 성능 벤치마크

---

## 참고 문서

- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md):
  완료된 Phase 기록
- [AGENTS.md](../AGENTS.md): 개발 워크플로
- [ARCHITECTURE.md](./ARCHITECTURE.md): 3계층 구조
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md): 코딩 규칙
- [MAINTENANCE.md](./MAINTENANCE.md): 유지보수 체크리스트

> **과거 Phase 기록**:
> [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) 참조
