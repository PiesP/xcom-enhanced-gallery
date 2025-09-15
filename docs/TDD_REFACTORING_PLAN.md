# TDD 리팩토링 활성 계획

아래 항목들은 저장소 현황 점검 결과(2025-09-15) 도출된 고가치 리팩토링
과제입니다. 모든 항목은 TDD(RED→GREEN)로 진행하고, 완료 즉시
`docs/TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다.

공통 제약/정책

- 벤더는 getter만 사용: `@shared/external/vendors` (TDZ-safe 정적 API)
- PC 전용 입력만 사용(터치/포인터 금지), CSS Modules + 디자인 토큰만 사용
- 외부 API/브라우저/Userscript 접근은 adapter/getter 경유, import 부수효과 금지
- 최소 diff 원칙과 3계층 경계(Features → Shared → External) 준수

수용 기준(모든 과제 공통)

- 신규/수정 테스트 RED→GREEN, `npm run test:fast`/`test:unit` GREEN
- 타입/린트/의존성 검증 PASS(`npm run validate`, `npm run deps:check`)
- dev/prod 빌드 및 postbuild validator PASS

---

## 1) DOWNLOAD-FLOW-UNIFY-01 — 다운로드 경로 단일화(서비스 위임)

문제/배경

- `MediaService`가 `downloadSingle`/`downloadMultiple`을 자체 구현하고 있으며,
  `BulkDownloadService`+`DownloadOrchestrator`와 로직이 중복됩니다.
- 파일명 충돌 해결 로직(ensureUniqueFilename)이
  `MediaService`/`DownloadOrchestrator`에 중복 존재.
- 진행률/에러 UX가 경로별로 상이할 위험(토스트/코드/부분 실패 처리).

대안 비교

- A) 현 상태 유지(문서화만): 변경 최소, 그러나 드리프트/버그 발생 가능성 증가.
- B) MediaService → BulkDownloadService 얇은 위임으로 통합, 충돌 해결 로직은
  Orchestrator 단일 소스 사용: 중복 제거·일관성↑, 변경 범위 중간.
- C) BulkDownloadService 제거 후 MediaService로 흡수: 대규모 변경, 기존 소비처
  영향 큼.

결정(최적안): B 채택

- `MediaService.downloadSingle/Multiple`을 `getBulkDownloadService()`를 통해
  위임. 내부 중복 로직 제거.
- 충돌 해결 로직은 `DownloadOrchestrator`의 팩토리만 사용. 필요 시 helper로
  분리(export 없이 내부 유지).

TDD 단계

1. RED: 단위 테스트 추가
   - MediaService가 BulkDownloadService에 위임하는지 spy로 검증(진행률/결과 전달
     포함).
   - 파일명 충돌 시 `name-1.ext` 순 증분 보장(Orchestrator 경유) 테스트.
   - 에러/취소 시 코드/상태 매핑 일치 테스트(ErrorCode, BaseResultStatus).
2. GREEN: 최소 구현
   - MediaService의 downloadSingle/Multiple을 위임으로 교체(주석에 @deprecated
     wrapper 명시).
   - 중복된 `ensureUniqueFilename` 제거.
3. REFACTOR: 주석/타입 정리, 완료 로그 이관.

변경 범위(예상)

- `src/shared/services/MediaService.ts`(downloadSingle/Multiple → 위임, 중복
  삭제)
- 테스트: `test/unit/services/media-service.download.unify.test.ts`(신규)

수용 기준

- 위임/충돌 해결/상태 코드 테스트 GREEN, 기존 스위트 GREEN, 빌드/검증 PASS.

리스크/롤백

- 위임 경로에서 토스트/진행률 동작 차이 가능 → 테스트로 가드. 문제 발생 시
  feature flag로 MediaService 내부 경로를 임시 유지하는 가드 분기 복원 가능.

---

## 2) ZIP-API-SURFACE-REDUCE-01 — ZIP API 표면 축소(호출 단일화)

문제/배경

- `zip-creator.ts`의 `createZipFromItems`(+내부 download helpers)는 현재
  코드에서 직접 사용처가 없고, Orchestrator 경로(`createZipBytesFromFileMap`)와
  기능 중복.

대안 비교

- A) Deprecated 표기 후 유지: 외부/향후 사용 고려, 위험 낮음. 표면은 줄이지
  못함.
- B) 내부 테스트 헬퍼로 이동(비공개): 표면 축소, 호환성 리스크 중간.
- C) 완전 제거: 표면 최소화, 예기치 않은 외부 의존이 있다면 리스크 큼.

결정(최적안): A → B 순차 진행

- 1차: `@deprecated` JSDoc과 테스트 스캔으로 prod 소스에서의 사용 0건 가드.
- 2차: 다음 사이클에서 내부 테스트 헬퍼로 이동 검토.

TDD 단계

1. RED: 소스 스캔 테스트 추가 — prod `src/**`에서 `createZipFromItems` 임포트
   0건 보장.
2. GREEN: JSDoc deprecated 주석 추가.

변경 범위(예상)

- `src/shared/external/zip/zip-creator.ts`(JSDoc deprecated)
- 테스트: `test/unit/lint/zip-api-surface.scan.red.test.ts`(신규)

수용 기준

- 스캔 테스트 GREEN, 기존 기능/빌드/포스트빌드 가드 PASS.

리스크/롤백

- 외부 소비가 없음을 테스트로 보장. 추후 사용 수요 발생 시 어댑터 경유로 제공.

---

## 3) FETCH-OK-GUARD-01 — fetch 응답 가드 표준화

문제/배경

- 단일 다운로드 경로 일부에서 `response.ok` 검증이 누락되어 비정상 응답(4xx/5xx)
  시 불명확한 에러 메시지 가능.

대안 비교

- A) 필요한 지점만 보수: 변경 최소, 누락 재발 위험.
- B) 다운로드 경로 전역 표준화(단일 서비스 경유 + 공통 가드): 일관성↑, 회귀
  위험↓.

결정(최적안): B 채택 — 위임 통합(항목 1) 이후 BulkDownloadService 단일 경로에서
`ok` 가드 표준화.

TDD 단계

1. RED: 404/500 응답 모킹 시 의미 있는 에러 메시지/상태 코드 매핑 테스트.
2. GREEN: BulkDownloadService 단일/ZIP 내부 fetch 경로에 `!response.ok` 처리
   추가.

변경 범위(예상)

- `src/shared/services/BulkDownloadService.ts`
- 필요 시: `src/shared/external/zip/zip-creator.ts` 내 네트워크 경로(향후 B
  단계에서 헬퍼화)

수용 기준

- 에러 매핑 테스트 GREEN, 기존 스위트/빌드 가드 PASS.

리스크/롤백

- 메시지 변화로 일부 테스트 갱신 필요 가능. 실패 시 이전 메시지 문자열을 호환
  포맷으로 병행 노출.

---

## 4) PROGRESS-API-CONSISTENCY-01 — 진행률 이벤트 일관화

문제/배경

- `onProgress` 콜백의 최종 complete 이벤트(`percentage: 100`,
  `phase: 'complete'`) 보장이 경로마다 상이할 수 있음.

대안 비교

- A) 문서화만: 리스크 잔존.
- B) Orchestrator에서 종결 이벤트를 표준화하고 위임 경로는 그대로 전달.

결정(최적안): B 채택

TDD 단계

1. RED: 여러 파일 다운로드에서 마지막에 단 한 번의
   `{ phase: 'complete', percentage: 100 }`가 호출되는지 검증.
2. GREEN: Orchestrator/BulkDownloadService에서 보장 로직 추가 또는 누락 경로
   보완.

변경 범위(예상)

- `src/shared/services/download/DownloadOrchestrator.ts`
- `src/shared/services/BulkDownloadService.ts`(필요 시)

수용 기준

- 진행률 일관성 테스트 GREEN, 기존 스위트/빌드 가드 PASS.

리스크/롤백

- 일부 소비처가 중간 상태에 의존할 경우 동작 차이 가능 → 테스트로 가드하고 필요
  시 minor 버전에서 옵션 게이트 제공.

---

우선순위/순서(권장)

1. DOWNLOAD-FLOW-UNIFY-01
2. FETCH-OK-GUARD-01
3. PROGRESS-API-CONSISTENCY-01
4. ZIP-API-SURFACE-REDUCE-01

메모

- 본 계획은 “한 줄 구조 리팩토링 후, 최소 diff로 구현” 원칙에 따라 서비스 경계를
  유지하고, 벤더/유저스크립트 getter 사용 및 PC 전용 입력 정책을 엄격히
  준수합니다.
