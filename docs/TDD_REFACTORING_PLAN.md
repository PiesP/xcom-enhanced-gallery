# TDD 리팩토링 활성 계획

> 목적: 유저스크립트에 최적화된 “낮은 복잡성”을 지속 유지하고,
> 충돌·중복·레거시를 TDD로 안전하게 정리합니다. 완료된 내용은
> `docs/TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시 이관합니다. (최종 수정:
> 2025-09-15)

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
항목은 RED 테스트부터 시작합니다.

1. A1 — APP-CONTAINER-SOURCE-PRUNE
   - 목적: 런타임 소스에서 `features/gallery/createAppContainer.ts` 구현을
     제거(테스트 하네스 경로로 이전)하여 프로덕션 경로 오용/누출 가능성을 차단
   - 장점: 소스 경계 단순화, 번들 표면 축소, 가드 단순화
   - 단점: 테스트 import 경로 조정 필요, 일시적 마이그레이션 비용 발생
   - 수용 기준(DoD):
     - 소스 전역(runtime)에서 `createAppContainer` 심볼 사용 0건(정적 스캔
       RED→GREEN)
     - 테스트는 전용 하네스 경로에서 import하도록 수정, 전체 테스트 GREEN
     - postbuild validator에서 산출물 문자열에 `createAppContainer` 미포함

2. V3 — VENDOR-LEGACY-PRUNE-03 (동적 Vendor 제거 단계)
   - 목적: `shared/external/vendors/vendor-api.ts`와 `vendor-manager.ts` 동적
     매니저를 최종 퇴역(2단계)
   - 단계:
     - V3a: 소스/테스트 전역에서 vendor-api.ts 직접 import 0건 보증(스캔
       RED→GREEN, 현재 기준 유지 검증)
     - V3b: 동적 매니저/래퍼 파일 제거 또는 dev-only fallback로 축소, index는
       정적 안전 API만 유지
   - 장점: 정책/가드 간소화, 트리쉐이킹/분석 용이
   - 단점: 테스트/도구 일부에서 레거시 경로 의존 시 마이그레이션 필요
   - 수용 기준(DoD):
     - 정적 스캔에서 vendor-api.ts import 0건, 동적 VendorManager 심볼 미사용
     - dev/prod 빌드 및 postbuild validator GREEN(금지 문자열 미검출)
     - 전체 테스트 GREEN(벤더 초기화/모킹 경로 정상)

3. E4 — EVENT-ALIAS-REMOVAL-FINAL
   - 목적: `TwitterEventManager` 별칭 export 최종 제거(services/utils 내부 포함)
     및 소비처 전환을 확정
   - 장점: 이벤트 표면 혼동 제거, 문서/가드 일원화
   - 단점: 내부 참조가 잔존할 경우 소규모 수정 필요
   - 수용 기준(DoD):
     - 소스/테스트 전역에서 `TwitterEventManager` import 0건(내부 주석/문서
       제외)
     - 가드 테스트 업데이트 후 전체 스위트 GREEN
     - 외부 공개 표면은 `@shared/services/EventManager`만 유지

## 품질 게이트(DoD 공통)

- 타입/린트/테스트/빌드/포스트빌드 모두 GREEN, 문서 일치(CODING_GUIDELINES)
- 외부 API/UX 파손 없음(호환성 스모크) · 번들 크기 비악화
- 테스트 격리(ServiceHarness/벤더 getter) 및 PC 전용 입력 가드 준수

## 타임라인/우선순위(제안)

- Sprint A: A1(APP-CONTAINER-SOURCE-PRUNE)
- Sprint B: V3(VENDOR-LEGACY-PRUNE-03)
- Sprint C: E4(EVENT-ALIAS-REMOVAL-FINAL)

업데이트 이력: 2025-09-15 — 계획 문서 슬림화 및 활성 항목(A1/V3/E4) 등록.
ZIP/VENDOR(기존 단계) 관련 완료 항목은 COMPLETED로 이관.
