# TDD 리팩토링 활성 계획

> 목적: 유저스크립트에 최적화된 “낮은 복잡성”을 지속 유지하고,
> 충돌·중복·레거시를 TDD로 안전하게 정리합니다. 완료된 내용은
> `docs/TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시 이관합니다. (최종 수정:
> 2025-09-15, 활성 항목 처리 완료 — 본 문서는 슬림 상태 유지)

## 운영 원칙(요약)

- TypeScript strict 유지, 공개 표면 최소화(배럴은 필요한 심볼만 노출)
- 외부 라이브러리는 안전 getter만 사용(preact/@preact/signals/fflate/GM\_\*) —
  직접 import 금지
- PC 전용 입력만 허용(touch/pointer 금지), 충돌 가능 동작에 한해 preventDefault
- 스타일/애니메이션/레이어는 토큰만 사용(px/hex/ms/transition: all 금지)

참고: 상세 규칙과 가드는 `docs/CODING_GUIDELINES.md` 및 테스트 스위트에 명시되어
있습니다.

## 현재 상태(요약)

- 스모크·린트·타입·유닛 테스트·빌드/포스트빌드 가드: GREEN 유지
- 최신 작업(VND-GETTER-STRICT, GUARD-02, F1-c, TEST-DEDUP-VMOCK, DEPG-REFRESH)은
  완료되어 COMPLETED 문서에 이관됨

## 활성 계획(차기 단계, TDD 우선)

현재 활성 항목 없음. 새로운 요구가 생기면 RED 테스트부터 등록합니다.

## 품질 게이트(DoD 공통)

- 타입/린트/테스트/빌드/포스트빌드 모두 GREEN, 문서 일치(CODING_GUIDELINES)
- 외부 API/UX 파손 없음(호환성 스모크) · 번들 크기 비악화
- 테스트 격리(ServiceHarness/벤더 getter) 및 PC 전용 입력 가드 준수

## 타임라인/우선순위(제안)

- 활성 항목 없음. 차기 스프린트에 신규 항목 등록 예정.

업데이트 이력: 2025-09-15 — 활성 과제 처리 완료(위 5개 항목 이관). COMPLETED
문서 참조.
