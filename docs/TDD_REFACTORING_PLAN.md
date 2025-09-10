# 🎨 TDD 리팩토링 계획 — 디자인 현대화(간결 버전)

> 테스트 우선(TDD)으로 유저 스크립트 소스를 모듈화·간결화하고, 타입/의존성/성능
> 기준을 일관화합니다.

## 1) 현재 상태 스냅샷 (2025-09-10)

- 디자인 시스템 핵심(B4/C1/C2: 토큰/라디우스/계약)은 완료되어 완료 로그로
  이관되었습니다.
- 본 문서는 디자인 측면의 간결성/일관성/현대화 항목에 집중합니다.
- 기준 원칙: TypeScript strict 100%, 의존성 getter, PC 전용 이벤트, 디자인 토큰
  100% 사용.

## 2) 의사결정(Decision Log)

- D1. 번들 전략: Vite(Rollup) 단일 userscript 아티팩트 유지, 개발 시 코드 스플릿
  허용(릴리즈는 단일 파일).
  - 장점: Tampermonkey/Violentmonkey 호환성 보장, 디버깅은 개발 환경에서 용이
  - 단점: 릴리즈 시 트리셰이킹 결과 확인 필요(사이즈 예산 관리)
- D2. 의존성 격리: preact, fflate, GM\_\* 등은 vendor/tampermonkey getter로
  주입. 직접 import 금지.
  - 장점: 테스트에서 모킹 용이, 런타임 환경 차이를 격리
  - 단점: 얇은 어댑터 유지 필요
- D3. 상태/이벤트: UI는 preact + signals, 서비스 계층은 경량
  EventEmitter(커스텀) 사용. RxJS 등 신규 대형 의존성 도입 금지.
  - 장점: 번들 사이즈 최소화, 테스트 단순
  - 단점: 고급 스트림 오퍼레이터는 미지원(요구 없음)
- D4. 에러/로깅: Result 패턴 + createScopedLogger 표준화. 실패 경로 테스트 필수.
- D5. 입력 처리: PC 전용(Mouse/Keyboard/Wheel), 터치 이벤트 비사용. 키 지원은
  가이드라인 상수만 허용.

- D6. 스타일 아키텍처: CSS Modules + Semantic Tokens 우선, 컴포넌트 alias는
  과도기용만 허용.
  - 장점: 런타임 오버헤드 없음, 트리셰이킹/번들 영향 최소, 토큰 일관성 보장
  - 단점: 전역 변수 의존, 토큰 네임 충돌 시 테스트 필요
- D7. 인터랙션 컴포넌트: IconButton 패턴 통일(사이즈/호버/포커스/ARIA), 커스텀은
  합성 우선.
  - 장점: 접근성/일관성↑, 테스트/리뷰 용이
  - 단점: 기존 산발적 버튼 교체 작업 필요

## 3) 단계별 TDD 플랜 (Red → Green → Refactor)

본 단계(애니메이션 토큰 정규화, 테마 커버리지, 접근성 시각 피드백)는 모두
완료되어 가드 테스트가 GREEN 상태입니다. 세부 진행사항은
`TDD_REFACTORING_PLAN_COMPLETED.md` 에 정리되었습니다.

## 4) 적용 가능한 솔루션 옵션과 선택

- 번들
  - 단일 번들(선택): Tampermonkey 호환 안정성↑ / 동적 로딩 제약
  - 다중 청크: 로딩 최적화 / 일부 매니저에서 import 실패 리스크
  - 결정: 단일 번들(릴리즈), 개발은 코드 스플릿 허용
- 상태 관리
  - signals(선택): 경량/반응성 / 학습비용 낮음
  - 커스텀 observable: 제로 의존성 / 재사용성↓
  - 결정: UI는 signals, 서비스는 경량 이벤트
- 다운로드 구현
  - 순수 fetch: 파일 저장 제약(Greasemonkey) / 단순
  - GM_download(선택): 저장 UX 우수 / 샌드박스 종속성
  - 결정: GM_download 1순위, fetch+xhr fallback

- 스타일링
  - CSS-in-JS: 조합성↑/동적 테마 용이 / 번들 및 런타임 오버헤드, userscript 환경
    부적합
  - 전역 CSS: 간단 / 충돌 위험, 캡슐화 약함
  - CSS Modules + Tokens(선택): 캡슐화/경량/테스트 친화 / 토큰 네임 관리 필요
  - 결정: CSS Modules + Semantic Tokens, alias는 점진 제거

## 5) 체크리스트(진행)

- [x] 애니메이션 토큰 100% 및 reduce-motion 대응
  - 완료: 유틸리티(.xeg-anim-_) + 컴포넌트 애니메이션(.xeg-animate-_) + 갤러리
    피처 CSS 전부 duration/easing 토큰화 및 정책 테스트 추가
- [x] 테마 커버리지 1차(Glass Surface light/dark/system 오버라이드 가드)
  - 진행: design-tokens.css glass surface 토큰 커버리지 테스트 추가 및 통과
  - 다음: 기타 핵심 표면으로 확장 필요 시 추가
- [x] 접근성 시각 피드백 정합성(hover/active/focus)
  - 완료: SettingsModal/Toast에 focus-visible 토큰 적용, lift 정책 정렬(토큰
    또는 em), 가드 테스트 추가 및 통과
- [x] Docs: PC 전용 이벤트 예시/README 최신화

### Backlog(비-디자인)

- [x] Download: 실패 요약 리포트 및 파일명 충돌 자동 해소 정책(-1, -2)
- [x] Extraction: 규칙 유틸 통합 및 중복 제거(회귀 테스트 유지)

## 6) 품질 게이트

- Build PASS, Lint PASS(Strict, getter 강제 룰), Test PASS(단위+스모크)
- 사이즈 예산(릴리즈): gzip 기준 경고/실패 임계치 설정
- 접근성: 포커스/대비 스모크 확인

## 7) 진행 현황 표기(간결)

- B/C 단계 완료분은 완료 로그 참조. 본 계획은 Userscript 현대화 범위에 한정.

---

요약: Tampermonkey 호환 단일 번들 + 의존성 getter +
MediaProcessor/DownloadService 중심의 TDD로 단계적 현대화를 진행합니다.
