# TDD 리팩토링 활성 계획

> 목적: 유저스크립트에 최적화된 “낮은 복잡성”을 지속 유지하고,
> 충돌·중복·레거시를 TDD로 안전하게 정리합니다. 완료된 내용은
> `docs/TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시 이관합니다. (최종 수정:
> 2025-09-15, 활성 항목 신규 등록 —
> VND-GETTER-STRICT/F1-c/GUARD-02/TEST-DEDUP/DEPG-REFRESH)

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

1. VND-GETTER-STRICT — 벤더 getter 전용 사용 강제(직접 함수 export/사용 금지)

- 문제: `@shared/external/vendors` 배럴에서 Preact 원시 함수(`h`, `render`,
  `Component`, `Fragment`)를 직접 재노출 중입니다. 현재 소스에서 직접 사용
  빈도는 낮지만, 정책상 “getter 전용” 일관성/모킹 용이성을 약화시킬 수 있습니다.
- 선택지
  - A. 현 상태 유지(문서 가이드만): 마이그레이션 비용 0, 정책 균열 위험
    지속(일관성 저하)
  - B. 배럴에서 직접 export 제거 + 스캔 가드 추가(권장): getter(`getPreact`)만
    허용, 테스트/소스 리팩토링 최소
- 결정: B 채택. 배럴의 직접 export 제거(또는 @deprecated 게이트) 및 정적 스캔
  테스트 추가로 `src/**`에서 `{ h, render, Component, Fragment }`를 배럴로부터
  import하는 패턴을 금지(테스트/모킹 파일은 허용 목록으로 관리).
- TDD(RED): `test/unit/lint/vendor-getter.strict.scan.red.test.ts` — 소스에서
  배럴 직함수 import 0건 보장(타입 전용 제외).
- DoD: 소스 리팩토링 후 GREEN, 타입/린트/빌드 및 postbuild 가드 유지.

2. F1-c — features/gallery 배럴 표면 슬림화(클래스 직접 export 축소)

- 문제: `src/features/gallery/index.ts`가 `GalleryRenderer`/`GalleryApp`
  클래스까지 노출. 외부 소비는 주로 직접 경로(dynamic
  import)·service-accessors를 사용하므로 배럴 공개 표면 축소 여지가 있습니다.
- 선택지
  - A. 유지: 변경 영향 0, 표면 과대 노출 지속
  - B. 타입/팩토리 위주로 축소(권장): 공개 표면 최소화, 순환/의존성 복잡도 감소
- 결정: B 채택. 배럴은 타입·팩토리(필요 시)만 유지하고 클래스 export는 제거.
  기존 소비처는 직접 경로 사용 유지.
- TDD(RED): `test/unit/lint/features-barrel.class-exports.scan.red.test.ts` —
  features 배럴에서 클래스/구현 export 금지(동일 feature 내부 타입/팩토리만
  허용).
- DoD: 스캔 GREEN, 타입/빌드 영향 없음.

3. GUARD-02 — 배럴 역참조 순환 가드(정적 스캔 추가)

- 문제: 내부 모듈이 상위 배럴(`src/shared/index.ts` 등)을 import하는 역참조로
  사이클 리스크가 존재(가이드에 원칙만 기재).
- 선택지
  - A. 문서 가이드만 유지: 누락 케이스 재발 가능
  - B. 정적 스캔 가드 도입(권장): 내부 모듈은 구체 경로 import만 허용
- 결정: B 채택. `src/shared/**` 내부에서 상위 배럴 경유 import 금지 스캐너
  추가(테스트/타입 파일 일부 예외 허용).
- TDD(RED): `test/unit/lint/barrel-reimport.cycle.scan.red.test.ts` — allowlist
  외 배럴 역참조 import 0건.
- DoD: 스캔 GREEN, dependency-cruiser 순환 0 유지.

4. TEST-DEDUP-VMOCK — 벤더 모크 중복 정리

- 문제: `test/utils/mocks/vendor-mocks*.ts` 유사 구현 중복으로 테스트 유지 비용
  상승.
- 선택지
  - A. 유지: 즉시 비용 0, 장기 유지비 증가
  - B. 단일 헬퍼로 통합(권장): 공통화 + 옵션 플래그로 변형 지원
- 결정: B 채택. 공통 모듈로 통합하고 기존 경로는 리다이렉트/삭제. 영향 범위:
  테스트 한정.
- TDD(RED): 간단한 계약 테스트(`vendor-mocks.contract.test.ts`) 추가.
- DoD: 테스트 전 스위트 GREEN, 중복 파일 제거/리다이렉트 완료.

5. DEPG-REFRESH — 의존성 그래프/문서 최신화

- 문제: `docs/dependency-graph.json`에 레거시 경로(`vendor-api.ts`) 잔존.
- 선택지
  - A. 유지: 문서–소스 간 불일치 지속
  - B. 스크립트 재실행 및 산출물 업데이트(권장)
- 결정: B 채택. `npm run deps:all` 재생성 후 문서 반영.
- TDD: 문서 갱신만(스모크 수준), 포스트빌드 가드와 충돌 없음 확인.
- DoD: 최신 그래프 산출, CI 아티팩트 업데이트.

## 품질 게이트(DoD 공통)

- 타입/린트/테스트/빌드/포스트빌드 모두 GREEN, 문서 일치(CODING_GUIDELINES)
- 외부 API/UX 파손 없음(호환성 스모크) · 번들 크기 비악화
- 테스트 격리(ServiceHarness/벤더 getter) 및 PC 전용 입력 가드 준수

## 타임라인/우선순위(제안)

- Sprint 제안 순서(위험/효익 대비)
  1. VND-GETTER-STRICT
  2. GUARD-02
  3. F1-c
  4. TEST-DEDUP-VMOCK
  5. DEPG-REFRESH

업데이트 이력: 2025-09-15 — 신규 5개 과제
등록(VND-GETTER-STRICT/F1-c/GUARD-02/TEST-DEDUP/DEPG-REFRESH). 완료 항목은
COMPLETED 문서 참조.
