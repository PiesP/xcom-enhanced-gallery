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

| Phase | 목적          | 주요 산출물        | 상태 |
| ----- | ------------- | ------------------ | ---- |
| R4    | 전면 치환     | 모든 소비처 수정   | 대기 |
| R5    | 최적화/사이즈 | 코드젠/사이즈 가드 | 대기 |
| R6    | 정리/문서화   | 완료 로그 갱신     | 대기 |

## 신규 Epic 제안: TBAR-O — 툴바 아이콘/인디케이터 최적화

목표(베이스라인: commit 최신 master HEAD)

툴바 구현에서 다음 문제가 관찰됨:

1. 아이콘 사이즈 토큰 중복 정의
   - `design-tokens.css`와 `design-tokens.component.css` 모두 `--xeg-icon-size`
     및 variant(sm/md/lg) 선언 → 드리프트 위험
   - 일부 컴포넌트(예: `Toolbar.module.css` / `Gallery.module.css`)에서
     `font-size` 또는 고정 `2.5em` / `36px` 기반 높이 사용 → 토큰 일관성 저하
2. `IconButton`에 `size="toolbar"` 추가가 있으나 내부 아이콘 실제 렌더 크기와
   버튼 컨테이너 크기(`2.5em`)가 분리 관리 → 유지보수 비용 증가
3. 미디어 카운터(현재/전체 + 진행률 바) 레이아웃이 단일 파일 내부 인라인
   구성으로 재사용성/테스트 격리 한계
4. legacy `.controls` (하단 glassmorphism 컨트롤)와 신규 `Toolbar` 공존 →
   스타일/이벤트 중복, 회귀 위험
5. 접근성(a11y) 확인 자동화 부족: 모든 icon-only 버튼 `aria-label`/`title` 가드
   테스트 부재, 카운터 aria-live 동작 중복 가능성

성과 지표 (Success Criteria)

- 단일 소스 아이콘 사이즈 토큰: 최종 선언 위치
  1곳(`design-tokens.component.css`), `design-tokens.css`는 alias (Deprecated
  label 주석)
- Toolbar 내 모든 버튼 높이/폭/아이콘 크기 관계: `--xeg-icon-size-{md|lg}` +
  `--xeg-size-toolbar-button` (신규)로 명시화
- `<MediaCounter>` 컴포넌트 도입: stacked / inline 레이아웃 전환 가능, aria-live
  polite, 0개(total=0) 처리 안전
- legacy `.controls` DOM 노출 제거 (테스트로 탐지 시 RED)
- a11y 테스트: Toolbar 내 icon-only button 전수 `aria-label` 존재 / progress bar
  `role="progressbar"` + `aria-valuenow/aria-valuemax`
- 번들 사이즈 영향 +1% 이내 (기존 코드 제거로 상쇄)

### 대안 비교

| 옵션 | 설명                             | 장점                     | 단점                                 | 채택 |
| ---- | -------------------------------- | ------------------------ | ------------------------------------ | ---- |
| A    | 토큰 단일화 (component layer)    | 드리프트 제거, 추론 용이 | 레거시 기대치 변경 위험              | ✔   |
| B    | Signals 기반 IconSize context    | 런타임 동적 조절         | 과도한 복잡도, 현재 요구 미약        | ✖   |
| C    | Toolbar 루트 CSS 변수 오버라이드 | JS 무관, 반응형 쉬움     | 기존 명시적 size prop 일부 정리 필요 | ✔   |
| D    | MediaCounter 컴포넌트 추출       | 재사용/테스트 용이       | 최초 추출 비용                       | ✔   |
| E    | 유지 (현상 고수)                 | 작업 없음                | 복잡성/드리프트 누적                 | ✖   |

선택 전략: A + C + D (필수) + legacy 제거 단계적 적용. B는 향후 확대 필요 시
백로그 이전.

### Phase 설계 (TDD RED → GREEN → REFACTOR)

| Phase | 코드명       | 목표                       | RED (테스트)                                     | GREEN (구현)                                                 | REFACTOR                           |
| ----- | ------------ | -------------------------- | ------------------------------------------------ | ------------------------------------------------------------ | ---------------------------------- |
| P3    | tbar-counter | MediaCounter 컴포넌트 분리 | 기존 counter 구조 스냅샷/role 누락 테스트        | `<MediaCounter>` 도입, aria 속성 부여, layout prop           | Toolbar.tsx 간소화, dead 코드 제거 |
| P4    | tbar-scope   | Toolbar CSS 변수 주입      | 버튼 높이/아이콘 사이즈 불일치 테스트            | `.galleryToolbar` 루트에 CSS 변수 설정 + size prop 의존 축소 | Button/Icon 문서화 갱신            |
| P5    | tbar-legacy  | legacy 제거                | `.controls` 존재 RED                             | Gallery.module.css `.controls` 제거 or feature flag          | BACKLOG migration note             |
| P6    | tbar-a11y    | a11y 강화                  | progressbar aria-role/valuenow/valuemax 누락 RED | role="progressbar" props + aria-valuetext                    | README a11y 섹션 갱신              |
| P7    | tbar-clean   | 정리/회귀 가드             | 사이즈/토큰 스냅샷 회귀 RED                      | 잔여 주석/alias 정리                                         | PLAN 완료 로그 이관                |

### 세부 구현 메모

1. 토큰 통합
   - 유지: `--xeg-icon-size-sm|md|lg` + `--xeg-icon-size`(alias→md)
   - 추가: `--xeg-size-toolbar-button` (예: `2.25rem` → 기존 2.5em 재검토,
     터치가드 미지원 PC 전용이므로 36~40px 범위) 수치 결정은 디자인 토큰
     규칙(OKLCH 기반 spacing scale) 근거
   - 제거: root legacy 개별 픽셀 직접 값(주석 Deprecation)
2. MediaCounter 컴포넌트
   - Props:
     `{ current: number; total: number; layout?: 'stacked'|'inline'; showProgress?: boolean }`
   - 계산: percent = total>0 ? ((current+1)/total)\*100 : 0
   - a11y: wrapper `role='group'` + 라이브 텍스트 `aria-live='polite'`; progress
     `role='progressbar'`
3. Toolbar 통합
   - Toolbar.tsx에서 counter JSX 제거 → `<MediaCounter />`
   - IconButton size 속성 중 `toolbar` 유지 (클래스 매핑)하되 내부 Icon size
     default는 CSS 변수 전가
4. 테스트 추가
   - duplicate-icon-token.test.ts: CSS 파일 로드 후 `--xeg-icon-size` 정규식
     매칭 횟수 === 1
   - toolbar-aria-contract.test.tsx: 모든
     `[data-gallery-element^='nav-'] button`의 `aria-label` 존재
   - media-counter-layout.test.tsx: layout prop 변경 시 class 토글/DOM 구조
     스냅샷
   - progress-a11y.test.tsx: progressbar aria-valuenow/valuemax 일치
   - legacy-controls-elimination.test.ts: `.controls` 클래스 노출 금지
5. 회귀 가드
   - dependency-cruiser 규칙(선택): features → shared/styles 직접 path 내 legacy
     파일 import 차단
6. 위험 및 완화
   - 위험: 스타일 회귀 (높이/정렬). 완화: before/after DOM metrics 스냅샷
     테스트(높이 px 수용 오차 ±2)
   - 위험: 번들 증가. 완화: 제거 코드량 대비 diff size 추적(build-metrics.js
     확장)
7. 롤백
   - Feature flag `data-tbar-new='1'` 제거 시 이전 구조(브랜치 보존)로 되돌릴 수
     있게 P3 commit 분리

### 비범위 (Out of Scope)

- 모바일 터치 최적화(프로젝트 PC 전용 정책 유지)
- Icon sprite sheet 생성(추후 퍼포먼스 Epic 고려)
- 다국어(i18n) 카운터 텍스트 변환 (향후 접근성 Epic)

### 완료 조건 (AC)

- 테스트 스위트 GREEN (신규 6개 테스트 포함)
- design tokens 내 icon-size 선언 중복 0
- Toolbar 렌더 시 `.controls` DOM 미존재
- MediaCounter layout 전환 테스트 PASS (stacked ⇄ inline)
- a11y 검사: aria-label 누락 0, progressbar 속성 일치
- 번들 prod gzip 증가 ≤ +1%

### 추적

| Key        | 값                             |
| ---------- | ------------------------------ |
| Epic Code  | TBAR-O                         |
| Start Date | 2025-09-18                     |
| Owner      | Frontend/Infrastructure Hybrid |
| Status     | P1–P2 완료 / P3 대기           |

---

## TDD 규칙과 브랜치

1. RED → GREEN → REFACTOR 순으로 커밋 구성
2. 병합 전 필수 게이트: 타입/린트/전체 테스트/빌드/사이즈 가드 PASS
3. 완료 시: 계획 문서에서 제거하고 완료 로그에 1줄 요약 추가

## 참고

- 완료 로그: docs/TDD_REFACTORING_PLAN_COMPLETED.md
- 백로그: docs/TDD_REFACTORING_BACKLOG.md
- 코딩 규칙: docs/CODING_GUIDELINES.md
