# 🔄 TDD 리팩토링 계획 (간결·현대화 버전)

> 테스트 우선으로 실패·상충 테스트를 정리하고, 일관된 디자인/아키텍처 정책으로
> 통합합니다.

## 1) 현재 상태 스냅샷 (2025-09-10)

- 테스트 요약: Test Files 18 failed | 153 passed | 7 skipped / Tests 7 failed
- 주된 실패 원인
  - A. 모듈 해상도 실패: 기대 경로의 컴포넌트/훅/서비스 없음
    - Toolbar/ToolbarHeadless, Toolbar/UnifiedToolbar,
      Toolbar/ConfigurableToolbar
    - SettingsModal/\* (Headless/Unified/Enhanced), LazyIcon, iconRegistry,
      gallery-store
    - @features/gallery/hooks/useToolbarPositionBased
  - B. 정책 충돌
    - 토큰: 테스트는 component token `--xeg-comp-modal-*` 요구 vs 현재 CSS는
      semantic token `--xeg-modal-*` 사용
    - 클래스: TSX 내 'glass-surface' 금지 테스트 vs 현재 TSX에서 사용 중
    - 외부 라이브러리 접근: 직접 `from 'preact'` import 탐지됨 → vendors getter
      정책 위반
  - C. 디자인 시스템 일관성
    - 애니메이션 토큰/패턴 불일치
    - CSS 변수 네이밍 컨벤션 검사 실패, 스타일 수(선택자 수) 기대 미달

참고: 기존 문서의 "완료" 표기 중 일부(예: glass-surface 제거, component token
적용)는 현재 코드/테스트 결과와 상이하여 정정합니다.

## 2) 의사결정(Decision Log)

- D1. 토큰 정책: Semantic을 소스 오브 트루스로 유지하되, 호환 alias로 component
  token을 제공한다.
  - 이유: 기존 가이드라인(테마 토큰 완료)을 존중하면서, 현 테스트 기대를 빠르게
    충족
  - 방법: `--xeg-comp-modal-bg` → `var(--xeg-modal-bg)` 등 alias 레이어
    추가(컴포넌트 CSS 우선 적용)
- D2. glass-surface 사용: TSX 문자열 사용 금지, 효과는 CSS Module 내부에 캡슐화
- D3. 외부 의존성: 모든 외부 라이브러리는 vendors getter로 통일, 직접 import
  제거(코드모드 적용)
- D4. 결측 모듈: 테스트가 참조하는 경로에 인터페이스 우선의 최소
  구현(Headless+Shell 패턴의 스텁) 제공 후 점진 구현
- D5. 애니메이션/네이밍: 공통 motion 토큰 정의 및 주요
  컴포넌트(Button/Toolbar/Toast) 동기화, CSS 변수 네이밍 룰 재정렬

## 3) 단계별 TDD 플랜 (Red → Green → Refactor)

Phase A. 테스트 가로막는 임계 이슈 제거 (Fail Fast blockers)

- A1. 모듈 스텁 추가(인터페이스 중심, 타입 명시) → import 해상도 해결
  - ToolbarHeadless, UnifiedToolbar, ConfigurableToolbar
  - SettingsModal(Headless/Unified/Enhanced), LazyIcon, iconRegistry,
    gallery-store
  - useToolbarPositionBased
  - 성공 기준: 해당 테스트 파일의 "Failed to resolve import" 사라짐
- A2. vendors getter 강제
  - 코드베이스에서 `from 'preact'` 직접 참조 제거 → `@shared/external/vendors`
    경유
  - 성공 기준: Architecture Dependency Rules 통과

Phase B. 디자인/토큰 정책 일관화

- B1. Component Token Alias 레이어 도입
  - CSS: `--xeg-comp-modal-bg/border`를 사용하도록 컴포넌트 CSS 수정
  - Alias: component → semantic 매핑 정의(중앙 파일 또는 :root 레이어)
  - 성공 기준: color-token-consistency, glass-surface-consistency 관련 통과
- B2. TSX에서 'glass-surface' 문자열 제거, CSS Module로 효과 이전
- B3. 애니메이션 토큰 통합
  - 공통: `--xeg-motion-fast/normal`, `--xeg-ease-standard`, `--xeg-button-lift`
    등
  - 적용: Button, Toolbar, Toast에 동일 패턴 적용
  - 성공 기준: button-animation-consistency 통과
- B4. CSS 네이밍/볼륨 점검
  - 변수 접두/패턴 점검(`--xeg-comp-*`, `--xeg-color-*`, `--xeg-radius-*` 등)
  - 선택자 수/중복도 기준 상향(테스트 기대 충족)

Phase C. Toolbar 계약 정리 (fitModeGroup 등)

- C1. fitModeGroup 계약 재정의: Headless 계약 + Shell 클래스 노출(테스트 양쪽
  충족하도록 어댑터 제공)
- C2. radius 정책 문서화 및 CSS 반영(가이드라인 준수: md/lg/xl/2xl/pill/full)

## 4) 적용 가능한 솔루션 옵션과 선택

- 옵션 1: 테스트 기대에 맞춰 전면 component token 전환
  - 장점: 테스트 즉시 녹색, 명시적 컴포넌트 기준
  - 단점: 테마 토큰 시스템과 중복, 유지보수 이중화 위험
- 옵션 2: Semantic 유지 + Component Alias(선택) [선택]
  - 장점: 단일 소스 유지, 테스트 일치, 단계적 이전/철회 용이
  - 단점: 초기 alias 관리 필요
- 옵션 3: 테스트 수정으로 semantic만 허용
  - 장점: 정책 단순화
  - 단점: 테스트 대수 수정 리스크, 합의 필요

결정: 옵션 2 채택(D1).

## 5) 체크리스트 (요구사항 → 작업)

- [ ] 모듈 해상도 실패 제거(스텁 생성, 타입 엄격)
- [ ] vendors getter 강제(코드모드/ESLint 룰)
- [ ] SettingsModal CSS: `--xeg-comp-modal-*` 사용, TSX의 'glass-surface' 제거
- [ ] Component→Semantic 토큰 alias 정의
- [ ] 공통 애니메이션 토큰 정의 및 적용(Button/Toolbar/Toast)
- [ ] CSS 변수 네이밍 컨벤션 정리와 선택자 볼륨 기준 충족
- [ ] fitModeGroup 계약 어댑터로 상충 테스트 동시 만족

## 6) 품질 게이트

- Build PASS, Lint PASS(TypeScript strict, 외부 의존성 격리 룰), Test PASS(전량)
- 스모크: SettingsModal panel/modal 모드 렌더, focus trap 동작, token 적용 수동
  확인

## 7) 진행 현황 표기(간결)

- 완료로 표시했던 항목 중 실제 미완료 항목 정정: glass-surface 제거, component
  token 적용 → 미완료(이 계획에서 수행)
- 이미 안정화: 빌드/ESLint/Prettier 워크플로(유지)

---

요약: 테스트 장애물(해상도/정책)을 우선 제거하고, Semantic 기반을 유지하되
Component alias로 호환층을 제공하여 충돌을 해소합니다. Headless+Shell 스텁을
추가해 TDD 루프를 빠르게 녹색으로 전환한 뒤, 애니메이션·네이밍을 표준화합니다.
