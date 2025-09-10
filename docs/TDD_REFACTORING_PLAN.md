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

참고: 기반 레이어/MediaProcessor/로깅·에러/부트스트랩/빌드 자동화는 완료. 아래는
디자인 현대화 중심 잔여 항목입니다.

1. IconButton/Action Controls 통일

- Red: 갤러리 내 아이콘 전용 버튼(닫기/내비게이션/다운로드 등)이 IconButton
  계약(사이즈/ARIA/포커스 링/토큰) 위반 시 실패하는 테스트 작성
- Green: 모든 해당 버튼을 IconButton 합성으로 교체,
  `--xeg-radius-md`/hover/active/포커스 토큰 적용
- Refactor: 변형(variant) 프로퍼티 최소화 및 공통 스타일 유틸 추출 성공 기준:
  위반 0건, 접근성 스모크(키보드 탐색/포커스 가시성) 통과

2. Overlay/Modal/Surface 토큰 일관화

- Red: 갤러리 오버레이/컨테이너/토스트/모달에서 배경/보더/그림자 토큰 미사용을
  탐지하는 테스트
- Green: `--xeg-gallery-bg`, `--xeg-modal-bg`, `--xeg-modal-border`,
  `--xeg-shadow-*`로 치환
- Refactor: 컴포넌트 alias 제거(가능한 범위), semantic 토큰 직참조로 단순화 성공
  기준: 하드코딩 색상/보더 0건, 다크/라이트 대비 테스트 통과

3. 애니메이션 토큰/감속 정책 정규화

- Red: transition/animation에 토큰 미사용 또는 ease 키워드 직접 사용 시 실패
- Green: `--xeg-duration-*`, `--xeg-ease-*`로 통일, reduce-motion 시 애니메이션
  비활성 확인
- Refactor: 공통 transition 유틸 변수로 중복 제거 성공 기준: 애니메이션 토큰
  100%, reduce-motion 스모크 통과

4. 테마 커버리지 감사(Audit)

- Red: 갤러리 주요 표면(컨테이너/툴바/버튼 상태)의 테마 토큰 누락 리포트 테스트
- Green: 누락 지점에 토큰 적용, 시스템/수동 테마 전환 시 시각적 리그레션 없음
- Refactor: 테마별 오버라이드 최소화, 기본 토큰에 수렴 성공 기준: 커버리지 100%,
  라이트/다크 스냅샷 테스트 통과

5. 접근성 시각 피드백 정합성

- Red: focus-visible, hover/active 리프트와 그림자 토큰이 표준을 벗어나면 실패
- Green: 모든 인터랙션 요소에 동일 패턴 적용(리프트/그림자/포커스 링)
- Refactor: 인터랙션 유틸 클래스 또는 mixin으로 재사용화 성공 기준: 포커스
  가시성 AA 스모크, 상호작용 상태 시각 일관성 체크 통과

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

- [ ] IconButton/Action Controls 통일(사이즈/ARIA/토큰)
- [ ] Overlay/Modal/Surface 토큰 일관화(배경/보더/그림자)
- [ ] 애니메이션 토큰 100% 및 reduce-motion 대응
- [ ] 테마 커버리지 100%(라이트/다크 스냅샷)
- [ ] 접근성 시각 피드백 정합성(hover/active/focus)
- [ ] Docs: PC 전용 이벤트 예시/README 최신화

### Backlog(비-디자인)

- [ ] Download: 실패 요약 리포트 및 파일명 충돌 자동 해소 정책(-1, -2)
- [ ] Extraction: 규칙 유틸 통합 및 중복 제거(회귀 테스트 유지)

## 6) 품질 게이트

- Build PASS, Lint PASS(Strict, getter 강제 룰), Test PASS(단위+스모크)
- 사이즈 예산(릴리즈): gzip 기준 경고/실패 임계치 설정
- 접근성: 포커스/대비 스모크 확인

## 7) 진행 현황 표기(간결)

- B/C 단계 완료분은 완료 로그 참조. 본 계획은 Userscript 현대화 범위에 한정.

---

요약: Tampermonkey 호환 단일 번들 + 의존성 getter +
MediaProcessor/DownloadService 중심의 TDD로 단계적 현대화를 진행합니다.
