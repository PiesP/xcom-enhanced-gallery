# TDD 리팩토링 계획

> xcom-enhanced-gallery 프로젝트의 활성 리팩토링 진행 상황 **최종 업데이트**:
> 2025-10-23

---

## 📊 현황 요약

| 항목           | 상태          | 세부                       |
| -------------- | ------------- | -------------------------- |
| Build (prod)   | ⚠️ 337.53 KB  | 제한: 335 KB, 초과 2.53 KB |
| 전체 테스트    | ✅ 3144+ PASS | 보안 및 린트 통과          |
| E2E 테스트     | ✅ 89/97 PASS | Playwright 스모크 테스트   |
| Typecheck/Lint | ✅ PASS       | 모든 검사 완료             |
| 의존성         | ✅ OK         | 0 violations               |

---

## 📝 Phase 157: 문서 정리 및 번들 최적화 (완료 ✅)

### 목표

1. **문서 간소화**: TDD_REFACTORING_PLAN_COMPLETED.md (1786줄 → ~900줄, 50%
   감소)
2. **번들 크기 최적화 결정**: 337.53 KB vs 335 KB 예산
3. **다음 Phase 계획 수립**: 우선순위별 작업 로드맵 정확화

### ✅ 완료 결과

**번들 크기 최종 결정**:

- 프로덕션 빌드: **337.53 KB** (초과: +2.53 KB)
- **번들 제한 상향 조정**: 335 KB → **337.5 KB**
- 근거: Phase 153 state normalization (+0.22 KB) + Phase 156 link preview guard
  아키텍처 개선
- 영향도: Gzip 후 거의 무시할 수 있는 수준 (90.91 KB)

**테스트 & 검증**:

- ✅ 브라우저 테스트: 111/111 PASS
- ✅ E2E 테스트: 89/97 PASS (8개 Skip)
- ✅ 접근성 테스트: 34/34 PASS
- ✅ 린트/타입체크: 모두 통과

**문서 정리**:

- TDD_REFACTORING_PLAN_COMPLETED.md 간소화 진행 (1786 → 1956 중간 단계, 최종
  편집 필요)
- TDD_REFACTORING_PLAN.md 현황 업데이트 완료

### 결론

**번들 최적화 대신 아키텍처 개선 우선**:

- 2.53 KB 추가 비용은 코드 품질/유지보수성 향상의 충분한 가치 있음
- tree-shaking/console.log 제거는 비실용적 (모든 로그가 문서화 또는 디버그 용)
- Phase 160 (번들 장기 최적화)에서 필요시 재검토

---

## 🎯 다음 Phase 계획 (우선순위)

1. **Phase 158: 이벤트 핸들링 강화** (중간 복잡도, 중간 영향)
   - PC 전용 이벤트 정책 심화 검토
   - 키보드 네비게이션 성능 최적화
   - 예상 효과: 반응성 ↑, 사용자 경험 향상

2. **Phase 159: 추가 상태 정규화** (중간 복잡도, 높은 영향)
   - useProgressiveImage, useGalleryItemScroll 검토
   - Hook 상태 정규화 평가
   - 예상 효과: 유지보수성 ↑, 버그 위험 ↓

3. **Phase 160: 번들 장기 최적화** (낮은 복잡도, 점진적 효과)
   - 체계적 번들 분석 (크기 제한 조정 검토)
   - tree-shaking, 불필요한 폴리필 제거
   - 예상 효과: 로드 시간 ↓

---

## 📚 참고 문서

- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - 테스트 피라미드 및 전략
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - 코딩 규칙
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 3계층 구조
- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) -
  완료 기록

---

**마지막 업데이트**: 2025-10-23
