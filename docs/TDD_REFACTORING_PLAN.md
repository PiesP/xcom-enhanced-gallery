# 🔄 TDD 리팩토링 계획 — 유저 스크립트 현대화(간결 버전)

> 테스트 우선(TDD)으로 유저 스크립트 소스를 모듈화·간결화하고, 타입/의존성/성능
> 기준을 일관화합니다.

## 1) 현재 상태 스냅샷 (2025-09-10)

- B4/C1/C2는 완료되어 완료 로그로 이관했습니다. 본 문서는 유저 스크립트 현대화
  계획만 남깁니다.
- 기준 원칙: TypeScript strict 100%, 외부 의존성은 getter 함수로만 접근, PC 전용
  이벤트만 사용.

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

## 3) 단계별 TDD 플랜 (Red → Green → Refactor)

1. 기반 레이어(Adapters & Types)

- 테스트: tampermonkey 어댑터가 GM\_\* 존재 시 위임/부재 시 no-op/fallback 동작
- 구현: `getTampermonkey()` + 타입 선언, `getVendors()`에서 preact/fflate 제공
- 리팩터: 오류 메시지/스택 표준화, 타입 내보내기 일원화

2. MediaProcessor (핵심 추출 파이프라인)

- 테스트: HTMLElement에서 미디어 URL 배열 추출, 유효 도메인 필터링, 빈 입력→[]
- 테스트: `generateOriginalUrl` 규칙 검증, 잘못된 URL은 skip
- 구현: 최소 통과 후, 캐시/재시도/타임아웃(옵션) 단계적 추가

3. DownloadService (GM_download 래퍼)

- 테스트: 동시성 제한, 실패 재시도, 취소 토큰 지원, GM\_\* 미지원 시 xhr
  fallback
- 구현: 큐 기반 스케줄러 + 진행 이벤트, 파일명 패턴 적용

4. Gallery 부트스트랩(레이어 분리)

- 테스트: 트윗 DOM 감지 시 Lazy init, PC-only 핫키(Enter/Escape) 동작 스모크
- 구현: `startApplication()` 내 책임 분리(탐지/초기화/정리), 전역 핸들러 정리

5. 로깅/에러 표준화

- 테스트: shouldLog 레벨, 타임스탬프/스택 포함 포맷
- 구현: `createScopedLogger`, `logError`, `measurePerformance`

6. 빌드/메타데이터

- 테스트: 유저스크립트 헤더 배너 주입(이름/버전/매치/권한), 소스맵 생성
- 구현: 릴리즈 사이즈 예산(예: ≤ 300KB gzip) 경고, 메타 데이터 자동화

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

## 5) 체크리스트(진행)

- [x] Adapters: Userscript 어댑터(`getUserscript`) 추가, `getVendors`는 현 구조
      유지
- [ ] Core: Result 타입/에러 유틸, logger 기초
- [ ] MediaProcessor: 추출/검증/정규화 + 테스트
- [ ] DownloadService: 큐/동시성/취소 + 테스트
- [ ] Bootstrap: Lazy init + PC-only 핫키 스모크
- [ ] Build: 헤더 배너/사이즈 예산/소스맵

## 6) 품질 게이트

- Build PASS, Lint PASS(Strict, getter 강제 룰), Test PASS(단위+스모크)
- 사이즈 예산(릴리즈): gzip 기준 경고/실패 임계치 설정
- 접근성: 포커스/대비 스모크 확인

## 7) 진행 현황 표기(간결)

- B/C 단계 완료분은 완료 로그 참조. 본 계획은 Userscript 현대화 범위에 한정.

---

요약: Tampermonkey 호환 단일 번들 + 의존성 getter +
MediaProcessor/DownloadService 중심의 TDD로 단계적 현대화를 진행합니다.
