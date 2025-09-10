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

참고: 기반
레이어/MediaProcessor/DownloadService(간소화)/로깅·에러/부트스트랩/빌드 자동화는
완료되어 완료 로그로 이동했습니다. 아래는 잔여/후속 정비 항목입니다.

1. DownloadService 고도화(선택)

- 테스트: ZIP 외 스트리밍 다운로드 경로 벤치(성능 단위), 실패 사유 리포팅 강화
- 구현: 실패 항목 요약 리포트, 파일명 충돌 자동 해소(policy: -1, -2 suffix)

2. MediaExtractor 백업 경로 일원화(선택)

- 테스트: `DOMDirectExtractor`와 `MediaMappingStrategy` 간 중복 제거 리그레션
- 구현: 공용 유틸로 추출 규칙 합치기, 테스트 유지

3. 문서/가이드라인 강화(소)

- CODING_GUIDELINES: userscript 환경에서의 PC 전용 이벤트 정책 예시 1문단 추가
- README: 설치/개발 모드 안내 최신화

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

- [x] Adapters: Userscript 어댑터(`getUserscript`) 추가, vendors getter 유지
- [x] Core: Result/로깅/에러 핸들러 표준화
- [x] MediaProcessor: 추출 파이프라인 + 테스트
- [x] DownloadService: ZIP/진행률/취소/동시성·재시도(기본)
- [x] Bootstrap: PC-only 핫키/즉시 초기화
- [x] Build: 헤더 배너/소스맵/사이즈 예산 경고·차단
- [ ] Follow-ups: Download 실패 요약/파일명 충돌 처리, 추출 규칙 통합(선택)

## 6) 품질 게이트

- Build PASS, Lint PASS(Strict, getter 강제 룰), Test PASS(단위+스모크)
- 사이즈 예산(릴리즈): gzip 기준 경고/실패 임계치 설정
- 접근성: 포커스/대비 스모크 확인

## 7) 진행 현황 표기(간결)

- B/C 단계 완료분은 완료 로그 참조. 본 계획은 Userscript 현대화 범위에 한정.

---

요약: Tampermonkey 호환 단일 번들 + 의존성 getter +
MediaProcessor/DownloadService 중심의 TDD로 단계적 현대화를 진행합니다.
