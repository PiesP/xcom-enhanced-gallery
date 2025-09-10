# 🔄 TDD 리팩토링 계획 (간결·현대화 버전)

> 테스트 우선으로 실패·상충 테스트를 정리하고, 일관된 디자인/아키텍처 정책으로
> 통합합니다.

## 1) 현재 상태 스냅샷 (2025-09-10)

- 남은 과제(핵심)
  - B4. CSS 변수 네이밍/볼륨 점검 보완(잔여 파일 점검 및 정규화)
  - C1. Toolbar fitModeGroup 계약 정리(Headless 계약 + Shell 어댑터 제공)
  - C2. Border Radius 정책 일괄 반영(md/lg/xl/2xl/pill/full) - 일부 완료
- 참고: 다음 항목은 완료되어 완료 로그로 이관되었습니다
  - UnifiedToolbar 스텁, vendors getter 강제, TSX 'glass-surface' 제거,
    component↔semantic alias 정리, 애니메이션 토큰 통합

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

Phase B. 디자인/토큰 정책 일관화(잔여)

- B4. CSS 네이밍/볼륨 점검
  - (진행) Toolbar 계열 비-토큰 참조 정규화 완료 → 잔여 스타일 시트 점검
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

## 5) 체크리스트 (남은 작업)

- [ ] B4: CSS 변수 네이밍 컨벤션/볼륨 재정렬(잔여 파일)
- [ ] C1: fitModeGroup 계약 정리(Headless+Shell 어댑터)
- [ ] C2: radius 정책 CSS 전면 반영(잔여 파일)

## 6) 품질 게이트

- Build PASS, Lint PASS(TypeScript strict, 외부 의존성 격리 룰), Test PASS(전량)
- 스모크: SettingsModal panel/modal 모드 렌더, focus trap 동작, token 적용 수동
  확인

## 7) 진행 현황 표기(간결)

- 완료 항목은 `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조
- 남은 항목: B4(잔여), C1, C2(잔여)

---

요약: Semantic을 소스 오브 트루스로 유지하고 Component alias로 호환층을 제공하는
결정을 유지합니다. 잔여 과제(B4/C1/C2)를 완료해 네이밍·계약·토큰 반영을
일관화합니다.
