# 🔄 TDD 리팩토링 계획 (간결·현대화 버전)

> 테스트 우선으로 실패·상충 테스트를 정리하고, 일관된 디자인/아키텍처 정책으로
> 통합합니다.

## 1) 현재 상태 스냅샷 (2025-09-10)

- 테스트 요약(초기 기준): Test Files 18 failed | 153 passed | 7 skipped / Tests
  7 failed
- 주된 실패 원인
  - A. 모듈 해상도 실패: 일부 경로 스텁/구현 부재
    - UnifiedToolbar (해결: 최소 스텁 추가)
    - 나머지: ToolbarHeadless/ConfigurableToolbar는 이미 존재, SettingsModal
      계열 존재, iconRegistry/LazyIcon 존재, gallery-store 존재,
      useToolbarPositionBased 존재
  - B. 정책 충돌
    - 토큰: component↔semantic alias 레이어 존재(해결: 중앙 파일에서 alias
      제공)
    - 클래스: TSX 내 'glass-surface' 사용 없음(해결)
    - 외부 라이브러리 접근: 일부 훅에서 직접 import 사용(부분 해결: 2건 교정)
  - C. 디자인 시스템 일관성
    - 애니메이션 토큰/패턴 불일치
    - CSS 변수 네이밍 컨벤션 검사 실패, 스타일 수(선택자 수) 기대 미달

참고: glass-surface, component token alias 등 상이 표기는 현 시점 기준으로
정리했습니다.

## 2) 의사결정(Decision Log)

- D1. 토큰 정책: Semantic을 소스 오브 트루스로 유지하되, 호환 alias로 component
  token을 제공한다.
  - 이유: 기존 가이드라인(테마 토큰 완료)을 존중하면서, 현 테스트 기대를 빠르게
    충족
  - 방법: `--xeg-comp-modal-bg` → `var(--xeg-modal-bg)` 등 alias 레이어
    추가(컴포넌트 CSS 우선 적용)
- D2. glass-surface 사용: TSX 문자열 사용 금지, 효과는 CSS에 캡슐화(준수)
- D3. 외부 의존성: 모든 외부 라이브러리는 vendors getter로 통일, 직접 import
  제거(코드모드 적용)
- D4. 결측 모듈: 테스트가 참조하는 경로에 인터페이스 우선의 최소
  구현(Headless+Shell 패턴의 스텁) 제공 후 점진 구현
- D5. 애니메이션/네이밍: 공통 motion 토큰 정의 및 주요
  컴포넌트(Button/Toolbar/Toast) 동기화, CSS 변수 네이밍 룰 재정렬

## 3) 단계별 TDD 플랜 (Red → Green → Refactor)

Phase A. 테스트 가로막는 임계 이슈 제거 (Fail Fast blockers)

- A1. UnifiedToolbar 엔트리 스텁 추가(완료)
  - 성공 기준: 해당 테스트에서 import 해상도 실패 없음
- A2. vendors getter 강제(완료)
  - 잔여 직접 import 제거 → `@shared/external/vendors` 경유
  - ESLint: vendors 디렉터리 내부만 직접 import 허용 예외 규칙 추가
  - 성공 기준: 리포지토리 검색 결과 vendors 외 직접 import 없음(테스트 제외)

Phase B. 디자인/토큰 정책 일관화

- B1. Component Token Alias 레이어 확인/보강(진행중)
  - Alias: component → semantic 매핑은 중앙 토큰 파일에서 제공됨(확인)
  - 컴포넌트 CSS에서 `--xeg-modal-*` 사용 유지(테스트와 호환)
- B2. TSX에서 'glass-surface' 문자열 제거(완료, TSX 내 검색 결과 없음)
- B3. 애니메이션 토큰 통합(완료)
  - 공통: `--xeg-duration-*`, `--xeg-ease-*`, `--xeg-button-lift` 기준으로 통일
  - 적용: AnimationService/BrowserService/VerticalImageItem 인라인 스타일 토큰화
  - 성공 기준: 하드코딩된 transition/easing 제거
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

- [x] UnifiedToolbar 스텁 추가로 모듈 해상도 실패 제거
- [x] TSX 내 'glass-surface' 제거 확인(정책 준수)
- [x] vendors getter 강제(ESLint 룰 보강, 코드모드 반영)
- [ ] Component↔Semantic alias 주석 및 문서 명시 강화
- [x] 공통 애니메이션 토큰 사용 일관성 점검(Button/Toolbar/Toast)
- [ ] CSS 변수 네이밍 컨벤션 점검 및 미세 조정
- [ ] fitModeGroup 계약 어댑터(필요 시) 작성

## 6) 품질 게이트

- Build PASS, Lint PASS(TypeScript strict, 외부 의존성 격리 룰), Test PASS(전량)
- 스모크: SettingsModal panel/modal 모드 렌더, focus trap 동작, token 적용 수동
  확인

## 7) 진행 현황 표기(간결)

- 완료: UnifiedToolbar 스텁, glass-surface TSX 제거, component↔semantic alias
  확인, 애니메이션 토큰 통합(서비스/컴포넌트 인라인 스타일 포함)
- 진행중: CSS 네이밍 점검, fitModeGroup 검토

---

요약: 테스트 장애물(해상도/정책)을 우선 제거하고, Semantic 기반을 유지하되
Component alias로 호환층을 제공하여 충돌을 해소합니다. Headless+Shell 스텁을
추가해 TDD 루프를 빠르게 녹색으로 전환한 뒤, 애니메이션·네이밍을 표준화합니다.
