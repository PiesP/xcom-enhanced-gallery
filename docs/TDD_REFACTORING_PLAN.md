# TDD 리팩토링 활성 계획

> 목적: 유저스크립트에 최적화된 “낮은 복잡성”을 지속 유지하고,
> 충돌·중복·레거시를 TDD로 안전하게 정리합니다. 완료된 내용은
> `docs/TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시 이관합니다. (최종 수정:
> 2025-09-15, 활성 항목 갱신 — L2/F1 완료 반영)

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
- 역사(log)·완료 기록은 COMPLETED 문서로 이관됨 — 본 문서는 “활성 계획”만 보관

## 활성 계획(차기 단계, TDD 우선)

다음 항목들은 Userscript 복잡성 최소화와 경계 하드닝에 직결되는 작업으로, 각
항목은 RED 테스트부터 시작합니다. 모든 작업은 다음 정책을 준수합니다: 벤더
getter 경유, PC 전용 이벤트, CSS Modules + 디자인 토큰, 사이드이펙트 금지.

1. I2 — ICONS-TRIM-USED-ONLY (아이콘 표면 슬림화)

- 목표: 사용되지 않는 아이콘 래퍼/매핑 제거, 필요 아이콘만 유지(맵 기반)
- 왜: 불필요 컴포넌트 축소로 번들/스캔 가벼움, 유지보수 용이
- 장점: 코드/번들 축소, dead export 제거. 단점: 후속 신규 아이콘 추가 시 등록
  필요
- 수용 기준(테스트/가드):
  - RED: 아이콘 사용 인벤토리 스캔 테스트(소스 내 실제 사용 아이콘 집합 계산)
  - GREEN: 미사용 아이콘 제거 후 스위트 GREEN, dependency-cruiser dead export 0

2. B2 — BUILD-BUDGET-TIGHTEN (빌드 버짓 강화)

- 목표: 포스트빌드 사이즈 버짓을 소폭 강화하여 회귀 조기 감지
- 왜: Userscript 크기 증가 억제. 이미 여유가 있어 보수적 조정 가능
- 장점: 크기 관리 자동화. 단점: 향후 기능 추가 시 버짓 조정 필요할 수 있음
- 수용 기준(가드):
  - RED: validator 임계치 상향(예: gzip ±1~2% 타이트)
  - GREEN: 현재 prod 빌드 통과, 회귀 시 원인 분석/최적화 유도

## 품질 게이트(DoD 공통)

- 타입/린트/테스트/빌드/포스트빌드 모두 GREEN, 문서 일치(CODING_GUIDELINES)
- 외부 API/UX 파손 없음(호환성 스모크) · 번들 크기 비악화
- 테스트 격리(ServiceHarness/벤더 getter) 및 PC 전용 입력 가드 준수

## 타임라인/우선순위(제안)

- Sprint A: L2(LOG-GATE-V2)
- Sprint B: F1(FEATURES-BARREL-HARDEN)
- Sprint C: I2(ICONS-TRIM-USED-ONLY)
- Sprint D: B2(BUILD-BUDGET-TIGHTEN)

업데이트 이력: 2025-09-15 — 계획 문서 갱신(D2/L2/F1/I2/B2 등록 → L2/F1 완료
반영). 이전 활성 항목(A1/V3/E4)은 COMPLETED 문서로 이관 상태 유지.
