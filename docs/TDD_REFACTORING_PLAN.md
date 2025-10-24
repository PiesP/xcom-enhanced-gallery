# TDD 리팩토링 계획

> xcom-enhanced-gallery 프로젝트의 활성 리팩토링 진행 상황 **현재 Phase**: 168
> (번들 최적화 평가) **마지막 업데이트**: 2025-10-24

---

## 📊 현황 요약

| 항목           | 상태         | 세부                                  |
| -------------- | ------------ | ------------------------------------- |
| Build (prod)   | ✅ 339.65 KB | 빌드 성공, 제한(420 KB) 여유 80.35 KB |
| npm run build  | ✅ PASS      | E2E 89/97 PASS, a11y 34/34 PASS       |
| npm test       | ✅ PASS      | fast + raf-timing 프로젝트 분리 운영  |
| Typecheck/Lint | ✅ PASS      | 모든 검사 완료, CodeQL 통과           |
| 의존성         | ✅ OK        | 0 violations                          |
| **현재 Phase** | � 168 준비중 | 번들 최적화 및 내보내기 정책 평가     |

---

## ✅ Phase 166: 코드 현대화 및 기술 부채 감소 (완료 2025-10-24)

**상태**: ✅ 완료 → COMPLETED로 이관됨

**달성사항**:

1. ✅ 빌드 제한 상향: 400 KB → 420 KB (official)
2. ✅ 코드 현대화: GalleryApp.ts 타입 단언 개선 (double cast → single cast)
3. ✅ 빌드 검증: 339.65 KB (gzip 91.47 KB)
4. ✅ E2E 테스트: 89 PASS
5. ✅ a11y 테스트: 34 PASS

**세부 내용**:
[TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) 참고

---

## 🔄 Phase 167: 테스트 정책 재평가 및 최적화 (완료 2025-10-24)

**상태**: ✅ 완료 - Option B 선택 및 실행 완료

**달성사항**:

1. ✅ TESTING_STRATEGY.md 갱신: npm run build vs npm test 우선순위 명시
2. ✅ 개발자 가이드 추가: 추천 워크플로우 (일반/버그/기능별)
3. ✅ 주의사항 문서화: npm test 실패 ≠ 배포 불가 원칙
4. ✅ CI 정책 명확화: npm run build 통과 필수 (E2E, a11y 포함)

**핵심 내용**:

- **npm run build** (권장): 전체 검증 (typecheck, lint, deps, CodeQL, browser,
  E2E, a11y)
  - 신뢰도 높음, 프로덕션 준비 완료 판정
  - CI/배포 전 필수 통과
  - 소요 시간: ~8-10분

- **npm test** (개발 편의): vitest projects 분리 (fast + raf-timing)
  - 신뢰도 낮음, 개발 편의용
  - E2E/a11y 미포함
  - 소요 시간: ~1-2분

**커밋**:

- `docs(phase-167): add npm run build vs npm test policy guidance` (0648ec6e)

---

## � Phase 168: 번들 최적화 및 내보내기 정책 평가 (준비 단계)

**상태**: 📋 계획 수립 (2025-10-24)

**목표**:

1. 번들 여유도 분석 (420 KB 대 339.65 KB = 80.35 KB 여유)
2. 미사용 export 정책 수립 (배럴 표면 축소)
3. Tree-shaking 기회 평가
4. 다음 우선순위 결정

**고려 사항**:

- 현재 빌드: 339.65 KB (제한: 420 KB)
- Phase 166/167 완료로 80.35 KB의 충분한 여유 확보
- 메인테넌스 모드 vs 추가 최적화 선택 시점
- 번들 크기 정책 재평가 가능 (425-430 KB 상향 여부)

**차기 액션**:

- [ ] 배럴 파일(`index.ts`) 분석 (미사용 export 검사)
- [ ] Tree-shaking 가능성 평가 (vendor 조건부 import)
- [ ] 성능/메모리 유틸리티 재검토 (Phase 134 후속)
- [ ] 문서/커뮤니티 피드백 수집

---

## �📚 참고 문서

- [AGENTS.md](../AGENTS.md) - 프로젝트 개발 환경, 테스트 전략
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Testing Trophy, vitest
  projects, npm run build vs npm test
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 3계층 구조
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - 코딩 규칙 & 정책
- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) -
  Phase 159-167 완료 기록
