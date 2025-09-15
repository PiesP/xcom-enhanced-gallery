# TDD 리팩토링 활성 계획

> 목적: 유저스크립트에 최적화된 “낮은 복잡성”을 지속 유지하고,
> 충돌·중복·레거시를 TDD로 안전하게 정리합니다. 완료된 내용은
> `docs/TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시 이관합니다. (최종 수정:
> 2025-09-15, 활성 항목 갱신 — 구식 스프린트 항목 정리, 신규
> F1-b/VND-LEGACY-MOVE 등록)

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

1. F1-b — Features 배럴 표면 추가 축소(설정 도메인 중심)

- 배경/문제: F1 가드로 “동일 feature 폴더 이외 재노출 금지”는 달성했으나,
  feature 배럴에서 구현(Service 클래스)까지 공개되면 공개 표면이 커져 리팩토링
  탄력성이 낮아집니다.
- 옵션 비교(요약)
  - A 유지: 현행 유지(구현까지 export) — 장점: 변경 없음, 단기 안전. 단점: 공개
    표면 과대, 순환/의존성 리스크 증가.
  - B 최소화: 배럴은 “UI + 타입 + Factory”만 재노출, 구현(Service 클래스)는 직접
    경로로만 사용 — 장점: 표면 최소화, 순환 리스크 감소, 테스트/모킹 용이. 단점:
    일부 import 경로 교체 필요.
  - C 점진: 우선 Factory만 병행 노출 후 점진 전환 — 장점: 마이그레이션 완충.
    단점: 과도기 중 표면 중복.
- 선택: B(최소화). 설정(feature/settings) 배럴을 “Settings factory/타입만
  노출”로 조정하고, 구현 클래스 직접 노출은 중단.
- 수용 기준(DoD)
  - 정적 스캔: 배럴에서 Service 구현명 재노출 0건(GREEN)
  - 소비처 빌드/테스트 GREEN(Factory 경유로 전환), 순환 의존 경고/오류 0건
  - 문서: CODING_GUIDELINES의 F1 보강 문구에 “배럴은 UI/타입/Factory에 한정”
    반영

2. VND-LEGACY-MOVE — 동적 VendorManager 소스의 테스트 전용 격리/명시

- 배경/문제: `src/shared/external/vendors/vendor-manager.ts`(동적 로딩)가
  런타임에 사용되지는 않으나, src 내 공존으로 혼동 여지가 있습니다(정책은 정적
  StaticVendorManager 권장).
- 옵션 비교(요약)
  - A 그대로: 현 상태 유지 + 가드 테스트만 — 장점: 무변경. 단점: 혼동/탐색 비용.
  - B 이동: 테스트 픽스처 경로로 이동(test/\_fixtures) 후 테스트 경로 수정 —
    장점: 의도 명확. 단점: 테스트 변경/경로 리라이트 필요.
  - C 명시화: 파일 상단 @deprecated test-only 주석 + 배럴 미노출 보장 + tsconfig
    빌드 제외 또는 글로브 예외(선택) — 장점: 변경 최소/의도 명확. 단점: 파일은
    여전히 src에 존재.
- 선택: C(명시화). 주석/태그로 테스트 전용임을 명시하고, 소스 스캔/포스트빌드
  가드로 prod 번들 유입 0을 유지.
- 수용 기준(DoD)
  - 소스 스캔: `vendor-manager.ts`로의 import 0건(GREEN)
  - 포스트빌드: 산출물 문자열에 `VendorManager`/`vendor-manager.ts`
    미존재(GREEN)
  - (선택) tsconfig 빌드 제외 글로브 초안 준비, 필요 시 적용

3. DOC-SYNC — F1 정책 보강 및 예시 정리(저위험)

- 내용: CODING_GUIDELINES의 F1 절에 “배럴은 UI/타입/Factory만”으로 표면 기준을
  명확화하고, 예시 import를 갱신합니다(코드 변경 없음).
- DoD: 문서 변경만, 모든 테스트/빌드 GREEN

## 품질 게이트(DoD 공통)

- 타입/린트/테스트/빌드/포스트빌드 모두 GREEN, 문서 일치(CODING_GUIDELINES)
- 외부 API/UX 파손 없음(호환성 스모크) · 번들 크기 비악화
- 테스트 격리(ServiceHarness/벤더 getter) 및 PC 전용 입력 가드 준수

## 타임라인/우선순위(제안)

- Sprint X: F1-b(배럴 표면 축소)
- Sprint Y: VND-LEGACY-MOVE(벤더 레거시 명시 격리)
- Sprint Z: DOC-SYNC(F1 문서 보강)

업데이트 이력: 2025-09-15 — 구식 스프린트(L2/F1 등 완료 항목) 목록 제거, 신규
F1-b/VND-LEGACY-MOVE/DOC-SYNC 등록. 완료 내역은 COMPLETED 문서에서 관리.
