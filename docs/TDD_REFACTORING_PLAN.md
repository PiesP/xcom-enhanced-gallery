# TDD 리팩토링 활성 계획 (경량)

본 문서는 진행 중인 활성 Phase만 유지합니다. 완료된 항목은
`TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시 이관합니다.

업데이트: 2025-09-18 — 활성 Epic: ICN-R (아이콘 사용 일관성 재구축)

## 운영 원칙(불변)

- TypeScript strict 100%, 공개 API 명시적 반환 타입
- 외부 의존성은 전용 getter 경유(preact/signals/fflate/GM\_\*) — 직접 import
  금지
- PC 전용 입력만 사용(click/keydown/wheel/contextmenu)
- 디자인/모션/spacing/z-index 모두 토큰 기반만 사용(raw 숫자/hex/ms 금지)
- Result status 모델: 'success' | 'partial' | 'error' | 'cancelled'

## 활성 Epic: ICN-R — 아이콘 사용 일관성 재구축

목표(타겟 베이스라인: commit `fb16404e`)

현재 번들에는 Hero\* 어댑터 함수들이 정적으로 포함되고 있으나(`Icon/index.ts`
배럴 재노출), `iconRegistry` 기반의 동적 로딩은 실제 소비 코드에서 아직 활용되지
않고 있음. 목표는 다음을 달성:

1. 소비 지점 모두가 배럴의 정적 import 대신 레지스트리(or Lazy wrapper)를 경유
   (Tree-shaking + 코드 스플리팅 강화)
2. 공통(above-the-fold) 핵심 아이콘(툴바 내 탐색/닫기/다운로드 등)은 초기
   Preload Hook (`preloadCommonIcons`) 유지/강화
3. 나머지 희소 사용 아이콘은 온디맨드 비동기 로딩 → 초기 번들 크기 감소
4. Icon 어댑터/스타일/접근성 규약은 토큰 기반 유지 (ARIA/role/sizing 규약 검증
   테스트 추가)
5. 향후 아이콘 추가/제거 시 switch-case 수동 편집 부담을 코드젠(or 선언적
   매핑)으로 완화

핵심 개선 방향 (요약)

- Hybrid 전략: 핵심 아이콘만 Preload + 나머지 Lazy
- `icon-map.ts` 선언 기반 dynamic import 맵 + (선택) 코드젠
- 소비 컴포넌트는 아이콘 이름만 의존
- 정책 테스트로 direct import, preload set, a11y, 사이즈 가드

대안 비교 (선택: Option C Hybrid) — 상세는 완료 로그 R1 항목 참조

### 잔여 Phase (TDD: RED → GREEN → REFACTOR)

3. ICN-R3 Hybrid Preload 적용
   - RED: 핵심 아이콘 Preload 미수행 시 E2E/단위(툴바 초기 렌더)에서 로딩 플래시
     검출 테스트
   - GREEN: `preloadCommonIcons()` 앱 초기화 시점(main/bootstrap) 호출 연결
   - REFACTOR: preload 세트 관리 유틸 (`core-icons.ts`)

4. ICN-R4 전체 전환
   - RED: 기존 정적 배럴 export 목록 중 특정 아이콘 직접 사용 검출(새 테스트)
   - GREEN: 남은 소비처 모두 LazyIcon/registry 경유로 변경
   - REFACTOR: 불필요한 hero/\* 어댑터 중복 로직 정리(스타일/ARIA 공통 util
     추출)

5. ICN-R5 최적화 & 사이즈 가드
   - RED: 번들 사이즈 회귀 테스트(> +5% 또는 Preload set 제외 아이콘 static 포함
     시 실패)
   - GREEN: dynamic import 분기(map/switch) 적용, dead code 제거 결과 사이즈
     안정
   - REFACTOR: 코드젠 스크립트(optional) `scripts/generate-icon-map.cjs`

6. ICN-R6 정리/문서화
   - RED: 레거시 배럴(정적 재노출) 존재 여부 스캔 테스트
   - GREEN: 불필요 배럴/주석 제거, README/PLAN 갱신
   - REFACTOR: `TDD_REFACTORING_PLAN_COMPLETED.md`에 1줄 요약 이관

Acceptance Criteria (AC)

- 모든 런타임 아이콘 로딩은 레지스트리 경유 (정적 Hero\* import 테스트 PASS)
- 핵심 아이콘 초기 렌더 시 네트워크 지연 없이 즉시 렌더 (Preload 테스트 PASS)
- 비핵심 아이콘 최초 사용 시 1회 로딩/캐시 후 재사용 (로딩 이벤트/캐시 테스트
  PASS)
- 접근성: Icon/버튼 관련 ARIA 계약 기존 테스트 세트 GREEN 유지
- 번들 dev/prod 사이즈 baseline 대비 +5% 이내 (사이즈 가드 테스트 GREEN)
- 디자인 토큰(`--xeg-icon-size-*`, `--xeg-color-*`) 외 하드코딩 스타일 없음

측정 & 메트릭 (Baseline: R1 완료 시점 — 값은 Completed 로그에 기록)

- raw/gzip 번들 크기
- 첫 Lazy 아이콘 로딩 지연 < 16ms
- 초기 뷰 Lazy 로딩 수 0 (모두 Preload set 또는 미사용)

테스트 명명 규칙 / 롤백 절차: 완료 로그 R1 항목 참조 (불변 정책)

## 활성 Phase 상태 표

| Phase | 목적           | 주요 산출물        | 상태 |
| ----- | -------------- | ------------------ | ---- |
| R3    | Hybrid Preload | preload 연결       | 대기 |
| R4    | 전면 치환      | 모든 소비처 수정   | 대기 |
| R5    | 최적화/사이즈  | 코드젠/사이즈 가드 | 대기 |
| R6    | 정리/문서화    | 완료 로그 갱신     | 대기 |

## TDD 규칙과 브랜치

1. RED → GREEN → REFACTOR 순으로 커밋 구성
2. 병합 전 필수 게이트: 타입/린트/전체 테스트/빌드/사이즈 가드 PASS
3. 완료 시: 계획 문서에서 제거하고 완료 로그에 1줄 요약 추가

## 참고

- 완료 로그: docs/TDD_REFACTORING_PLAN_COMPLETED.md
- 백로그: docs/TDD_REFACTORING_BACKLOG.md
- 코딩 규칙: docs/CODING_GUIDELINES.md
