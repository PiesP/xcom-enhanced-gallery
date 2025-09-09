# 🔄 TDD 리팩토링 플랜 (갤러리 툴바/모달 배경·핏 버튼 정합성)

본 문서는 현재 관찰된 두 가지 문제를 TDD로 해결하기 위한 단계적 계획을 담습니다.

- 문제 A: 이미지 크기 조정(핏) 버튼 4개가 그룹으로 묶여 보이는 현상
- 문제 B: 툴바/설정 모달/갤러리 배경이 투명하거나 과도하게 반투명하게 보이는
  현상

## ✅ 간결 요약: 이미 완료된 사항 (압축)

- 컴포넌트 통합: SettingsModal 단일화, Toolbar 단일화, Gallery View 정리
- 디자인 토큰: Primitive/Semantic/Component 계층 정비, 공통 Focus/Shadow 토큰
  정리
- 빌드·품질: 의존성 그래프 정상화, Orphan 코드 정리, 번들·CSS 소폭 감소

상세 수치·서사는 종전 보고서를 참조하며, 본 문서는 남은 품질 이슈 두 건을 TDD로
해결하는 계획에 집중합니다.

## 🔍 문제 분석 (Root Cause)

### A. 핏 버튼 그룹화 이슈

- 원인: `Toolbar.tsx`에서 핏 모드 버튼을 `<div className={styles.fitModeGroup}>`
  래퍼로 감쌈
- 현재 CSS: `fitModeGroup`는 배경/보더/패딩을 제거했으나, DOM 상 그룹 구조는
  유지됨 → 시각적·의미적 “그룹” 인상 잔존

### B. 배경 투명 이슈

- 확인된 미정의 토큰 사용:
  - `gallery-global.css` 내 `var(--xeg-gallery-bg)`, `var(--xeg-bg-toolbar)`가
    정의 부재 → CSS 변수 미해결 시 배경이 사실상 투명 처리
- 반투명 강제 유틸리티 사용:
  - 여러 컴포넌트가 공통 `glass-surface` 클래스를 사용 → `--opacity-glass: 0.85`
    기반 반투명 배경 적용
  - SettingsModal inner/Toolbar에 `glass-surface`가 직접 부착되어 불투명 테마
    배경 요구와 충돌

## 🧭 해결 전략 제안 (대안 비교)

### A. 핏 버튼 구조

1. 래퍼 제거하고 개별 버튼을 우측 섹션에 직접 배치
   - 장점: DOM이 요구사항과 일치, 여백/정렬을 섹션 공통 규칙으로 일원화, 회귀
     위험 낮음
   - 단점: `fitModeGroup` 존재를 가정한 일부 테스트 수정 필요

2. 래퍼 유지 + `display: contents` 적용
   - 장점: 최소 변경
   - 단점: 일부 브라우저/테스트 호환성 이슈, 의미적 그룹 흔적 유지 가능

3. 래퍼 유지 + 현행 유지(스타일로만 “그룹 박스” 제거)
   - 장점: 코드 변경 최소
   - 단점: 요구사항(각 버튼 독립 배치)와 불일치 지속

→ 선택: 1) 래퍼 제거 및 개별 배치

### B. 배경 투명/반투명

1. 누락 토큰 정의만 보완(`--xeg-gallery-bg`, `--xeg-bg-toolbar`)하여 기존 구조
   유지
   - 장점: 영향 범위 작음, 즉시 효과
   - 단점: `glass-surface`로 인한 반투명은 여전히 남음

2. Toolbar/SettingsModal에서 `glass-surface` 제거, 컴포넌트 스코프 토큰 적용
   - 예: `--xeg-comp-toolbar-bg/border/shadow`, `--xeg-comp-modal-bg/...`로 배경
     불투명화
   - 장점: 의도대로 테마 기반 불투명 배경 확보, 컴포넌트 토큰과 일관
   - 단점: 관련 스타일/테스트 업데이트 필요

3. 전역 `--opacity-glass: 1`로 상향
   - 장점: 간단
   - 단점: 진짜 유리 효과가 필요한 영역까지 모두 불투명화되어 디자인 유연성 상실

→ 선택: 2) 컴포넌트 토큰으로 전환 + 1) 누락 토큰 정의 보완 (병행)

## 🧪 TDD 플랜 (테스트 → 최소 구현 → 리팩토링)

사전 기준: TypeScript strict, 외부 의존성은 getter 함수로 격리, PC 전용
이벤트만.

### 1) 실패하는 테스트 추가 (Red)

- 테스트: 핏 버튼 독립 배치
  - `Toolbar` 렌더 후 `.toolbarRight` 직계 자식 중 `data-gallery-element`가
    `fit-*`인 버튼 4개가 존재해야 함
  - `.fitModeGroup` 존재 금지(assertNotFound)
- 테스트: 배경 토큰 정의
  - `design-tokens.semantic.css` 파싱하여 `--xeg-gallery-bg`, `--xeg-bg-toolbar`
    정의 검증(라이트/다크 폴백 포함)
- 테스트: Toolbar/SettingsModal 반투명 금지
  - `Toolbar.tsx`, `SettingsModal.tsx`에서 `glass-surface` 클래스 사용 금지
    스냅샷/정규식 검사
  - 대안: 해당 컴포넌트 CSS 모듈에 `background: var(--xeg-comp-*-bg)` 적용 여부
    정적 검증

### 2) 최소 구현 (Green)

- `design-tokens.semantic.css`에 누락 토큰 정의 추가
  - `--xeg-gallery-bg: color-mix(in srgb, black 85%, transparent)` (다크/라이트
    분기 포함) 또는 OKLCH 기반 일관 토큰 지정
  - `--xeg-bg-toolbar: var(--xeg-comp-toolbar-bg)`로 연결
- Toolbar/SettingsModal에서 `glass-surface` 제거
  - Toolbar: 루트에 컴포넌트 배경 토큰 반영 클래스
    적용(`background: var(--xeg-comp-toolbar-bg)` 등)
  - SettingsModal: `.modal`/`.panel` 또는 내부 래퍼에 `--xeg-comp-modal-*` 토큰
    사용
- 핏 버튼: `fitModeGroup` 래퍼 제거, 버튼 4개를 `.toolbarRight`에 직접 삽입
  (간격은 섹션 gap 활용)

### 3) 리팩토링 (Refactor)

- CSS 중복/레이어 정리: `gallery-global.css`의 `glass-surface` 이중 정의 제거 및
  유틸리티 분리
- 테스트 안정화: 스냅샷 노이즈 축소, 토큰 파싱 유틸 공통화
- 접근성 확인: 포커스 링/키보드 탐색 회귀 테스트 추가

## 🧱 구현 체크리스트

- [ ] test: 핏 버튼 독립 배치 검증 추가(그룹 래퍼 금지)
- [ ] test: 누락 토큰(`--xeg-gallery-bg`, `--xeg-bg-toolbar`) 정의 검증
- [ ] test: Toolbar/SettingsModal에서 `glass-surface` 미사용 검증
- [ ] tokens: semantic에 배경/툴바/모달 토큰 정의 추가(라이트/다크)
- [ ] toolbar: DOM에서 `fitModeGroup` 제거, 버튼 4개 개별 배치
- [ ] toolbar/styles: 컴포넌트 토큰 기반 불투명 배경 적용
- [ ] settings-modal/styles: 컴포넌트 토큰 기반 불투명 배경 적용
- [ ] cleanup: `glass-surface` 전역 유틸은 진짜 유리 효과가 필요한 컴포넌트로만
      제한

## � 성공 기준 (Acceptance)

- 핏 버튼 4개가 툴바 우측 섹션에 독립적으로 배치되고 시각적 “그룹 박스”가 보이지
  않는다
- 툴바/설정 모달/갤러리 오버레이·썸네일 컨테이너가 테마에 맞는 불투명(또는
  충분히 불투명한) 배경을 가진다
- 라이트/다크 테마 전환 시 배경 대비와 테두리/텍스트 가독성이 유지된다
- 테스트: 신규 3종 테스트 GREEN, 기존 회귀 테스트 GREEN

## ⚖️ 품질 게이트

- Build/Lint/Test: PASS
- TypeScript strict: PASS (새/변경된 파일 전부 any 금지)
- 스타일 정책: Border Radius 토큰 정책 준수(md/pill/full), 색상 하드코딩 금지,
  토큰 기반

## � 참고: 영향 범위와 리스크

- 영향 범위: Toolbar/SettingsModal/Gallery 글로벌 스타일(배경 관련) + 소수
  테스트 업데이트
- 주요 리스크: glass-surface 제거에 따른 예상치 못한 대비 변화 → 토큰 기반
  배경으로 안전장치 확보
- 완화책: 스냅샷 최소화, 토큰 중심 정적 테스트로 회귀 방지
