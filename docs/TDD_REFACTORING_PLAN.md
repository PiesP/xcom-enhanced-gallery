# TDD 리팩토링 활성 계획 (경량)

본 문서는 "아직 완료되지 않은" 활성 Phase만 유지합니다. 완료된 항목은
`TDD_REFACTORING_PLAN_COMPLETED.md`에 1줄 요약으로 이동합니다.

## 공통 가드 (불변)

- TypeScript strict 100%, 모든 공개 함수/서비스 명시적 반환 타입
- 외부 의존성: 전용 getter (preact / signals / fflate / GM\_\*) — 직접 import
  금지
- PC 전용 이벤트만 사용 (click | keydown | wheel | contextmenu)
- 디자인/모션/spacing/z-index는 토큰만 사용 (raw number/hex/ms 금지)
- Result status 모델 `success | partial | error | cancelled` 유지 (회귀 금지)

## 접근 전략 (요약: 옵션 평가 → 선택)

- A. 점진 모듈화/DI 강화(현 구조 유지, 서비스 경계 슬림화)
  - 장점: 위험/변경 범위 최소, 기존 테스트 재사용, 빠른 가치 창출
  - 단점: 일부 레거시 흔적 유지, 완전한 재설계 아님
- B. 전면 재작성(엔트리/서비스/컴포넌트 대수술)
  - 장점: 일관성 최고, 기술부채 일괄 청산
  - 단점: 리스크/기간 큼, 회귀 위험/커버리지 갭
- C. 표면 정리(린트/형식/네이밍만)
  - 장점: 매우 안전/빠름
  - 단점: 실질 구조/성능 개선 미미

선택: A (점진 모듈화) — Progressive Loader·벤더 getter·서비스 팩토리 패턴을
기반으로, 소스 간결성/일관성/현대성 확보를 TDD로 단계 적용.

## UI 감사 결과 요약 (2025-09-12)

현 빌드 산출물과 가이드/테스트 커버리지를 바탕으로 사용성/현대화 관점에서 다음
개선 여지가 확인되었습니다.

- JS 계층의 하드코딩 상수 존재: z-index/spacing/animation duration이 코드
  상수(CSS.Z_INDEX, CSS.SPACING, APP_CONFIG.ANIMATION_DURATION)로 남아 있음 →
  토큰/클래스로 이관 필요
- 키보드 네비게이션 보강 여지: Escape/Enter 중심 →
  Home/End/PageUp/PageDown/Arrow 가드 및 preventDefault 범위 명확화 필요(PC 전용
  정책 유지)
- 비디오 재생 제어와 Space 스크롤 충돌 가능성: 갤러리 포커스 컨텍스트에서
  Space/Arrow 동작 표준화 필요
- 레이아웃 안정성(CLS) 개선: 이미지 컨테이너 aspect-ratio 예약, 로딩
  스켈레톤(토큰 기반) 적용 여지
- 토스트/라이브영역 아나운스 정책: 실패/경고 위주 알림 최소화는 완비되었으나,
  번들 전역 아나운스 경로 통일(토스트→라이브영역 위임) 확인 및 하드닝 필요

위 항목을 TDD 단계로 진행합니다.

## 활성 목표 (요약)

- U8: 비디오 키보드 제어 표준화(Space/Arrow/Mute) — 갤러리 컨텍스트 한정
- U9: 레이아웃 안정성(CLS) 개선 — aspect-ratio 예약 + 스켈레톤
- U10: 토스트↔라이브영역 아나운스 경로 정합성 하드닝

## Phase 개요 (활성)

<!-- U6/U7: 2025-09-12 완료되어 완료 로그로 이관됨 -->

### U8 — 비디오 키보드 제어 표준화(컨텍스트 한정)

- 목표: 갤러리 컨텍스트에서 Space(재생/일시정지), ArrowUp/Down(볼륨), M(음소거)
  등 표준 키를 안전 제공.
- 접근: isVideoControlElement 가드와 포커스 컨텍스트 판단 사용. 문서 스크롤 충돌
  방지.
- 장점: 영상 UX 향상. 단점: 트위터 네이티브 컨트롤과의 충돌 회피 로직 필요.
- TDD(RED):
  - video-keyboard.controls.red.test.ts — 컨텍스트별 키 처리/충돌 회피 검증
- 완료 기준: GREEN, 기존 네이티브 플레이어와 중복 핸들러 없음

### U9 — CLS(누적 레이아웃 이동) 개선

- 목표: 이미지/비디오 컨테이너 aspect-ratio 예약 및 토큰화된 스켈레톤 적용으로
  초기 레이아웃 안정화.
- 접근: CSS Modules에 aspect-ratio 선언 및 placeholder 높이 예약. 스켈레톤은
  토큰 기반 색/모션 사용.
- 장점: 초기 로드 체감 개선. 단점: 일부 레이아웃 조정 필요.
- TDD(RED):
  - layout-stability.cls.red.test.tsx — 첫 페인트 전후 바운딩 박스 차이 임계
    가드
  - skeleton.tokens.red.test.ts — 스켈레톤 토큰 준수 가드
- 완료 기준: GREEN, 스타일 가이드 준수

### U10 — 토스트↔라이브영역 아나운스 정합 하드닝

- 목표: 사용자 알림 경로를 토스트 최소화 + 라이브영역 아나운스로 통일(중복
  방지).
- 접근: UnifiedToastManager가 라이브영역 매니저로 위임하도록 정책
  정리(오류/경고만 토스트).
- 장점: 소음 감소, 접근성 향상. 단점: 경계 리팩토링 일부 필요.
- TDD(RED):
  - a11y.announce-routing.red.test.ts — 실패/경고 시 live-region announce,
    성공/정보성 토스트 억제
- 완료 기준: GREEN, 기존 오류 복구 UX 표준과 일치

## 브랜치 & TDD 규칙

1. feature branch: `phase/<n>-<slug>`
2. 커밋 순서: RED (실패 테스트) → GREEN (최소 구현) → REFACTOR (정리/최적화)
3. 병합 전 품질 게이트: 타입/린트/전체 테스트/사이즈 가드 PASS

## Definition of Done

DONE 판정 시 아래를 충족해야 합니다:

- RED → GREEN → REFACTOR 커밋 히스토리
- 전체 테스트 / 타입 / 린트 / 빌드 / 사이즈 예산 PASS
- 문서: 가이드라인/계획 동기화, 완료 로그 기록
- 계획 문서에서 해당 Phase 제거

## 추적 & 백로그

- 추가 성능/메모리/보안 심화 항목은 `TDD_REFACTORING_BACKLOG.md` 유지
- 선택 Phase는 핵심 완료 후 우선순위 재평가

## 참고

- 완료 로그: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`
- 백로그: `docs/TDD_REFACTORING_BACKLOG.md`

업데이트 일시: 2025-09-12 (U6/U7 완료 반영 · U8–U10 활성화)
