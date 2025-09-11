# 🎨 TDD 리팩토링 계획 — Userscript 디자인 현대화 (새 사이클 제안)

> 목적: 소스 스타일/레이어/토큰/파이프라인을 더 간결·일관·현대적 구조로 정비.
> 완료된 과거 단계는 `TDD_REFACTORING_PLAN_COMPLETED.md`에만 기록합니다.

## 공통 가드 (불변)

- TypeScript strict 100%, 모든 함수/공개 메서드 명시적 반환 타입
- 외부 의존성: 전용 getter (preact / signals / fflate / GM\_\*)
- PC 전용 이벤트만 사용 (click / keydown / wheel / contextmenu)
- 디자인/모션/spacing/z-index는 토큰만 사용 (raw number/hex/ms 금지)
- Result status 모델: `success | partial | error | cancelled` (회귀 금지)

## 핵심 설계 선택 & 대안 비교 (요약)

1. 디자인 토큰 alias 정리
   - A: 컴포넌트 alias 다양성 유지 → 중복/학습비 증가, 제거 비용 지연
   - B (선택): 불필요 alias 단계 제거, semantic 직접 사용 + 최소
     alias(레이어/컴포넌트 특수)만 허용 → 단일 소스/검색 용이
2. z-index 및 레이어 스택
   - A: 컴포넌트별 임의 숫자 → 회귀/충돌 디버깅 비용↑
   - B (선택): 승인 리스트 토큰(`--xeg-z-(root|overlay|modal|toolbar|toast)`)
     정합 테스트 → 예측 가능
3. 애니메이션 정의
   - A: 컴포넌트마다 keyframes/transition 개별 작성 → 중복/불균일/정책 위반
     위험↑
   - B (선택): 공용 preset(utilities + animateCustom API) + 중복 탐지 테스트 →
     유지비↓, 정책 가드↑
4. Icon 전용/작은 상호작용 요소 스타일
   - A: IconButton + ad-hoc 클래스 혼재 → 접근성/크기 변형 일관성 저하
   - B (선택): IconButton size map + 토큰화된 spacing/radius 재사용, 외부
     컴포넌트는 조합만 허용
5. MediaProcessor 파이프라인
   - A: 클래스 내부 다단계 로직(내부 상태 혼합) → 단위 테스트 세분화 어려움
   - B (선택): 단계별 순수 함수(export) + orchestrator + progress observer →
     회귀 가시성/부분 교체 용이

## 활성 스코프 (현재)

현재 사이클에서 진행 중인 활성 Phase는 없습니다. (I18N 메시지 키 도입 Phase 4
옵션 과제는 완료되어 완료 로그로 이관되었습니다.)

새로운 개선 항목은 백로그(`docs/TDD_REFACTORING_BACKLOG.md`)에서 선별 후 본
문서에 추가됩니다.

## Phase 기록

모든 정의된 초기 Phase(1–4 + 옵션)는 완료되어
`TDD_REFACTORING_PLAN_COMPLETED.md`에만 보관됩니다. 이 문서는 새로운 Phase가
선정될 때까지 활성 스코프가 비어있는 상태를 유지합니다. (완료 Phase 요약은 완료
로그 상단 "Phase 요약" 섹션 참고)

## 작업 순서 & 브랜치 전략

이전 사이클의 Phase 절차는 모두 완료되었습니다. 이후 새 Phase를 도입할 때는
동일한 RED → GREEN → REFACTOR 절차를 재사용합니다.

## Definition of Done (공통)

- 각 Phase: RED 테스트 1+개 → GREEN → 회귀 스위트 전체 GREEN (MediaProcessor
  단계화 및 I18N 키 적용까지 모두 완료됨)
- 린트/타입/빌드 PASS, 사이즈 예산 위반 없음
- 문서(본 계획 + 가이드라인 필요 부분) 갱신
- 완료 즉시 해당 Phase 섹션을 본 문서에서 제거 & 완료 로그에 1줄 기록

## 추적 & 향후 후보

- 추가 성능/메트릭 항목(MP stage metrics, prefetch 실험)은 백로그 유지
- 메모리 프로파일(MEM_PROFILE)은 디자인 범위 밖 → 별도 사이클

## 참고

- 백로그: `docs/TDD_REFACTORING_BACKLOG.md`
- 완료 로그: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`

업데이트 일시: 2025-09-11 (Phase 4 옵션 과제 이관 후)
