# TDD 리팩토링 활성 계획

아래 항목들은 저장소 현황 점검 결과 도출된 고가치 리팩토링 과제입니다. 모든
항목은 TDD(RED→GREEN)로 진행하며, 완료 즉시
`docs/TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다.

## 활성 계획(2025-09-15 갱신)

공통 제약/정책: 벤더는 getter만 사용(@shared/external/vendors), PC 전용
입력만(터치/포인터 금지), 디자인 토큰만 사용, 모듈 임포트 시 부수효과 금지. 모든
항목은 실패하는 테스트 추가 → 최소 구현 → 리팩토링 순서로 수행합니다.

1. SEL-SOURCE-GUARD-01 — STABLE_SELECTORS 단일 소스 강제(소스 스캔)

- 문제: 개별 모듈에서 하드코딩된 CSS 선택자 사용 가능성이 있어 유지보수/드리프트
  위험.
- 해결: `src/constants.ts`의 `STABLE_SELECTORS`/`SELECTORS`만 사용하도록 소스
  스캔 가드 추가. 위반 파일은 리팩토링하여 상수 참조로 교체.
- 수용 기준:
  - 테스트: `test/unit/lint/selectors-single-source.scan.red.test.ts` 신설 —
    `src/**`에서 선택자 하드코딩 문자열(핵심 10여 개 패턴)이 상수 경유 없이
    사용되면 RED.
  - 리팩토링: 위반 0건(GREEN). 기존 기능/빌드/포스트빌드 가드 PASS.
- 장단점: (+) 드리프트 예방/검색 용이. (–) 초기 허용목록 튜닝 비용.

2. INPUT-PC-GUARD-02 — PC 전용 입력 소스 가드 강화

- 문제: 포스트빌드 가드는 번들 문자열만 검사. 소스 단계에서 조기 탐지 필요.
- 해결: `onPointer*`/`PointerEvent`/`onTouch*`/`TouchEvent` 사용을 소스 레벨에서
  스캔 RED. 테스트/모킹 파일은 허용목록으로 관리.
- 수용 기준:
  - 테스트: `test/unit/lint/pc-input-only.source.scan.red.test.ts` — `src/**`
    위반 0건.
  - 빌드 산출물 가드(기존)와 중복 이중 안전망 유지.
- 장단점: (+) 조기 회귀 차단. (–) 외부 타입 주석/문서 문자열의 오탐 가능성 —
  정규식 개선으로 완화.

3. UTILS-SVC-BOUNDARY-01 — Utils → Services 의존 금지 가드(정적)

- 문제: utils 레이어가 services에 의존하면 사이클/테스트 격리 저해.
- 해결: 정적 스캔(또는 dependency-cruiser 규칙)으로
  `src/shared/utils/** -> src/shared/services/**` import 금지.
- 수용 기준:
  - 테스트: `test/unit/lint/utils-services-boundary.scan.red.test.ts` — 위반
    0건.
  - 문서 규정과 일치(CODING_GUIDELINES 보강 불필요).
- 장단점: (+) 경계 견고화. (–) 소수 예외 필요 시 허용목록 관리 필요.

4. TW-VIDEO-LEGACY-NORMALIZER-01 — TwitterVideoExtractor 레거시 필드 정규화 분리

- 문제: `TwitterVideoExtractor` 내부에 legacy→modern 매핑 로직이 다소 분산/중복.
- 해결:
  `shared/services/media-extraction/normalizers/twitter-legacy-normalizer.ts`(신규)로
  정규화 추출. 기존 Extractor는 헬퍼를 호출.
- 수용 기준:
  - 테스트: normalizer 단위 테스트(입력 케이스: 기본/인용/사용자 legacy 포함)
    GREEN.
  - Extractor 기존 테스트 GREEN(기능 동일성).
  - 타입/린트/빌드/포스트빌드 PASS.
- 장단점: (+) 가독성/재사용 개선. (–) 파일 분리로 초기 경로 조정 비용.

5. SETTINGS-MIG-TESTS-02 — SettingsMigration 경로 커버리지 확대

- 문제: 기본값 병합/버전 업 마이그레이션에 대한 회귀 방지 테스트 보강 필요.
- 해결: 누락 필드/알 수 없는 필드 제거/버전 업 시 변환 등 마이그레이션 케이스
  추가.
- 수용 기준:
  - 테스트: `test/unit/settings/migration.fill-and-upgrade.test.ts` — v1.0.0 →
    v1.x 업그레이드, 누락 필드 자동 보정, 알 수 없는 필드 제거를 검증.
  - 기존 설정 손실 없음, 저장/로드 동작 동일(GREEN).
- 장단점: (+) 사용자 설정 안전성 강화. (–) 스냅샷 골든 데이터 관리 필요.

6. CSS-TOKEN-GUARD-01 — 디자인 토큰 사용 가드 확대(CSS/TSX)

- 문제: 컴포넌트 CSS/인라인 스타일에서 raw px/색상/transition all 사용 회귀
  위험.
- 해결: 정적 스캔 강화 — CSS Modules와 TSX 인라인 스타일에서 금지 패턴 스캔.
- 수용 기준:
  - 테스트: `test/unit/styles/design-tokens.policy.scan.red.test.ts` — 금지 패턴
    0건.
  - 스타일/토큰 가이드와 일치. 빌드/포스트빌드 PASS.
- 장단점: (+) 스타일 일관성/접근성 확보. (–) 일부 예외 경로 튜닝 필요.

우선순위/순서: 1 → 2 → 3(가드 계층) → 4(내부 구조) → 5 → 6.
