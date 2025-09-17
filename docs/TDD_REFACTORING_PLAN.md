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

문제 진단

- 정적 배럴 재노출로 인해 Hero 아이콘이 전부 메인 번들에 포함 → 불필요한 초기
  비용
- `iconRegistry` 동적 import 경로는 정의되었지만 실제 사용 경로 미연결 → 사일로
  코드
- 레거시 주석과 충돌 마커가 문서에 남아 의사결정 히스토리 추적성 저하
- 추후 아이콘 확장 시 수동 어댑터 중복 증가 가능성

핵심 개선 방향

- Hybrid 전략: 핵심 아이콘만 Preload + 나머지 Lazy (Fully static ↔ Fully
  dynamic 사이 타협)
- 아이콘 매핑을 단일 선언 객체(icon-map.ts 등)로 정의 → 코드 생성 스크립트로
  switch 분기 생성(or 직접 dynamic import map)
- 소비 컴포넌트(`Icon`, `IconButton`, Toolbar 등)는 아이콘 이름만 의존 → 구현
  교체 용이
- 테스트 레이어로 정책(직접 vendor import 금지, 사이즈 가드, 접근성, preload set
  포함)을 자동 검증

대안 비교

| 옵션 | 개요                             | 장점                             | 단점                              | 선정 여부 |
| ---- | -------------------------------- | -------------------------------- | --------------------------------- | --------- |
| A    | 현행 유지(정적 어댑터 배럴)      | 구현 0                           | 번들 비대, 레지스트리 미사용      | ❌        |
| B    | 전면 동적 로딩(모든 아이콘 lazy) | 초기 번들 최소                   | 퍼스트 페인트 시 지연/플리커 가능 | ❌        |
| C    | Hybrid: Preload 핵심 + Lazy 기타 | UX + 사이즈 균형, 점진 이행 용이 | 구성 관리 필요                    | ✅ (선정) |
| D    | SVG 인라인/자체 sprite           | 외부 의존 최소                   | 유지보수/업데이트 부담 큼         | ❌        |

선정 솔루션(Option C 세부)

1. `icon-map.ts` 선언: `{ Download: () => import('.../HeroDownload'), ... }`
2. 코드 사용부는 `<LazyIcon name="Download" />`(새 컴포넌트) 또는
   `useIcon(name)` 훅 사용
3. Preload: `preloadCommonIcons()`가 선언된 핵심 집합 (Download, Settings, X,
   ChevronLeft, ChevronRight)
4. 레지스트리: 실패 시 fallback 아이콘(간단한 ☐ outline) 제공, 캐시/디버그 정보
   유지
5. 번들 사이즈 가드: RED 테스트에서 baseline 비교(> +5% 증가 시 실패)

세부 Phase (TDD: RED → GREEN → REFACTOR)

1. ICN-R1 인벤토리 & 가드 추가
   - RED: 정적 Hero\* 직접 import 스캔 테스트 (배럴 외 사용 발견 시 실패)
   - GREEN: (없음 — 현 상태 기준으로 테스트 확립) → 커밋으로 베이스라인 고정
   - REFACTOR: 문서 conflict 마커 제거(본 커밋)

2. ICN-R2 LazyIcon 도입
   - RED: `<Icon>` 소비 위치 스냅샷 + 기대 로딩 상태(placeholder) 테스트 추가
   - GREEN: `LazyIcon` 구현 (registry.loadIcon 사용). 기존 배럴 export 경유
     사용부 1곳 치환(샘플)
   - REFACTOR: `IconButton` 내 아이콘 경로 추상화(`iconName` prop)

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

리스크 & 롤백

- Lazy 로딩 지연 → Hybrid 유지: Preload 집합만 확장하여 즉시 롤백
- 동적 import 경로 누락 → 레지스트리 미스 시 fallback + 콘솔 warn, 테스트로 조기
  검출
- 번들 팽창 → 코드젠/분기 재평가, 인라인 import 제거 커밋 빠른 revert 가능

측정/모니터링

- 번들 분석: 기존 `scripts/css-bundle-metrics.cjs` + 신규 아이콘 맵 통계
  출력(추가 예정)
- 테스트 태그: `@icon-registry`, `@icon-preload`로 필터 가능하게 명명

예상 산출물(추가/변경)

- `src/shared/components/ui/Icon/LazyIcon.tsx` (새 구현)
- `src/shared/services/icon-map.ts` (선언 기반 dynamic import 맵)
- `scripts/generate-icon-map.cjs` (선택적)
- 기존 hero/\* 어댑터 재활용 or 경량화
- 테스트: `test/unit/performance/icon-registry.lazy.test.tsx`,
  `test/unit/deps/icon-direct-imports.red.test.ts`

현재 진행 상태: ICN-R1 REFACTOR (문서 정리) 완료 시 -> ICN-R2 착수 예정.

## 활성 Phase (요약 표)

| Phase | 목적               | 주요 산출물            | 상태   |
| ----- | ------------------ | ---------------------- | ------ |
| R1    | 인벤토리/가드 확립 | 스캔 테스트, 문서 정리 | 진행중 |
| R2    | LazyIcon 도입      | LazyIcon, 샘플 치환    | 대기   |
| R3    | Hybrid Preload     | preload 연결           | 대기   |
| R4    | 전면 치환          | 모든 소비처 수정       | 대기   |
| R5    | 최적화/사이즈      | 코드젠/사이즈 가드     | 대기   |
| R6    | 정리/문서화        | 완료 로그 갱신         | 대기   |

## TDD 규칙과 브랜치

1. RED → GREEN → REFACTOR 순으로 커밋을 구성합니다.
2. 병합 전 필수 게이트: 타입/린트/전체 테스트/빌드/사이즈 가드 PASS.
3. 완료 시: 계획 문서에서 제거하고 완료 로그에 1줄 요약 추가.

## 참고 링크

- 완료 로그: docs/TDD_REFACTORING_PLAN_COMPLETED.md
- 백로그: docs/TDD_REFACTORING_BACKLOG.md
- 코딩 규칙: docs/CODING_GUIDELINES.md
