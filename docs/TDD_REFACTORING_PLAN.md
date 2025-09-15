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

## 1) FETCH-OK-GUARD-01 — fetch 응답 가드 표준화

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

## 2) PROGRESS-API-CONSISTENCY-01 — 진행률 이벤트 일관화

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

1. FETCH-OK-GUARD-01
2. PROGRESS-API-CONSISTENCY-01

메모

- 본 계획은 “한 줄 구조 리팩토링 후, 최소 diff로 구현” 원칙에 따라 서비스 경계를
  유지하고, 벤더/유저스크립트 getter 사용 및 PC 전용 입력 정책을 엄격히
  준수합니다.
