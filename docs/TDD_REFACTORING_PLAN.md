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

1. ZIP-UNIFY-01 — ZIP 생성 경로 단일화(Userscript 친화 간소화)

- 배경: fflate.zip(zipSync) 사용이
  `MediaService`/`DownloadOrchestrator`/`external/zip/zip-creator`로 분산되어
  중복/일관성 리스크 존재
- 목표: ZIP 생성은 오직 `shared/external/zip/zip-creator.ts` 경유로만 수행.
  서비스 레이어는 퍼사드로 위임
- TDD 흐름:
  - RED: 소스 스캔 테스트 추가 — zip_creator 외 파일에서
    `zipSync(`/`fflate.zip(` 사용 시 실패
  - RED: 계약 테스트 — 기존 MediaService/Orchestrator 경로와 zip-creator 경로의
    ZIP 바이트 동등성/에러 전파 일치
  - GREEN: MediaService/DownloadOrchestrator에서 ZIP 직접 생성 코드 제거 →
    zip-creator 위임. 로깅/옵션(level/concurrency) 보존
  - REFACTOR: 공통 변환 유틸(Map→ZipInput) zip-creator 내부로 이동, 서비스는
    단순 위임 유지
- DoD: zipSync 직접 사용 0건(소스 스캔 GREEN), 기능/에러/성능 스모크 동일,
  번들/가드 GREEN
- 장점: 중복 제거/테스트 표준화/모킹 용이. 단점: 경로 통합 중 일시적 회귀
  위험(테스트로 상쇄)

2. ZIP-LINT-01 — fflate 직접 사용 금지(경계 가드)

- 배경: 외부 라이브러리는 vendor getter + 전용 어댑터(zip-creator) 경유 사용이
  원칙
- 목표: zip-creator 외부에서 `fflate` API 직접 참조 금지
- TDD: 정적 스캔 테스트 추가(경로 allowlist=zip-creator 내부만 허용). 기존
  가드와 중복 시 하나로 통합
- DoD: 스캔 GREEN, 코드베이스 전역에서 fflate 직접 참조 0건

3. VENDOR-LEGACY-PRUNE-02 — vendor-api.ts 소스 레벨 금지 스캔

- 배경: prod 산출물 스캔 가드는 존재(문자열 검출). 소스에서의 직접 import 방지는
  보완 필요
- 목표: `src/shared/external/vendors/vendor-api.ts`를 테스트/마이그레이션 문맥
  외 소스에서 import 금지
- TDD: RED 스캔 테스트(allowlist: vendors/index.ts, test mocks만). GREEN 전환 시
  위반 0건 유지
- DoD: prod/ dev 빌드 산출물 가드 유지 + 소스 스캔 GREEN, 문서/가이드 일치

## 품질 게이트(DoD 공통)

- 타입/린트/테스트/빌드/포스트빌드 모두 GREEN, 문서 일치(CODING_GUIDELINES)
- 외부 API/UX 파손 없음(호환성 스모크) · 번들 크기 비악화
- 테스트 격리(ServiceHarness/벤더 getter) 및 PC 전용 입력 가드 준수

## 타임라인/우선순위(제안)

- Sprint A: ZIP-UNIFY-01 → ZIP-LINT-01
- Sprint B: VENDOR-LEGACY-PRUNE-02 및 문서/그래프 갱신

업데이트 이력: 2025-09-15 — 계획 문서 슬림화 및 ZIP 경로 단일화 계획 등록
