# 🎨 TDD 리팩토링 계획 — Userscript 소스 디자인 현대화

> 테스트 우선(TDD)으로 Userscript 소스를 간결·일관·현대적으로 개선합니다. 완료된
> 항목은 `TDD_REFACTORING_PLAN_COMPLETED.md`로만 관리합니다.

## 범위와 가드레일

- TypeScript strict 100%, 모든 함수 명시적 타입
- 외부 의존성은 getter 함수로만 접근(Preact, Signals, fflate, GM\_\*)
- PC 전용 입력만 사용(Mouse/Keyboard/Wheel)
- 디자인 토큰 100% 사용(색/시간/라디우스 하드코딩 금지)

## 적용 가능한 솔루션 비교(요약)

- 서비스 경계
  - 단일 모놀리식: 단순하지만 결합도↑, 테스트 격리 어려움
  - 기능별 서비스(Media/Extraction/Download/Filename): 경계 명확, 교체/테스트
    용이 (선택)
- 에러 모델
  - throw 기반: 코드 짧음 vs 실패 경로 불명확
  - Result<T,E> + Scoped Logger: 타입 안전·관찰성↑ (선택)
- Userscript API 사용
  - GM_download 우선 + fetch 폴백(선택): 권한/성능 활용, 환경 대응성↑
  - fetch/xhr만: 단순하지만 저장 제약/권한 이슈
- DOM 접근 전략
  - 직접 쿼리 분산: 중복/취약
  - SelectorRegistry + 안정 셀렉터(선택): 유지보수/테스트 용이

## 리팩토링 단계(테스트 우선)

Phase 1 — 환경 어댑터 계층 정리(getter-주입 강화)

- 목표: GM\_\*, preact, fflate 접근을 전용 getter 래퍼로 통일하고 타입 안전화
- 테스트(RED):
  - direct-imports-source-scan.test.ts — 외부 직접 import 0건
  - vendors.getters.mock.test.ts — getter 모킹 시 서비스 레이어 정상 동작
- 구현(GREEN): `@shared/external/vendors` 강화, 타입 가드 추가
- 완료 기준: 린트/정적 스캔 PASS, 단위 테스트 PASS

Phase 2 — SelectorRegistry로 DOM 접근 추상화 — 완료로 이관됨

(요약) STABLE_SELECTORS 기반 SelectorRegistry 도입 및 DOMDirectExtractor 통합.
상세 내역은 완료 로그 참조.

Phase 3 — 미디어 URL 정책 엔진 v2 — 완료로 이관됨

(요약) name=orig 강제/도메인 화이트리스트 유지, 중복 쿼리/확장자 보존,
video_thumb ID 지원 추가. 상세 내역은 완료 로그 참조.

Phase 4 — 다운로드 파이프라인 단순화 v2 — 완료로 이관됨

(요약) 진행률 이벤트/부분 성공/취소 지원, 동시성/재시도 옵션 도입 및 파일명 충돌
정책 일원화. 상세 내역은 완료 로그 참조.

Phase 5 — 주입 CSS 표준화 v2 — 완료로 이관됨

(요약) 주입 CSS/애니메이션 유틸을 토큰 기반으로 정규화하고, 하드코딩된
duration/easing을 제거했으며 가드 테스트를 통해 정책을 고정했습니다. 상세 내역은
완료 로그를 참조하세요.

Phase 6 — 로깅/진단 고도화 — 완료로 이관됨

Phase 7 — 성능 미세 튜닝 — 이미지 디코드 속성 적용 완료(이관), DOM 캐시 관련
항목은 성능 설정으로 이전됨

## 완료 기준(DoD)

- 각 Phase RED→GREEN, 회귀 테스트 유지
- getter-only 의존성, PC 전용 입력, 토큰 사용 위반 0건
- 문서/체인지로그 갱신 및 사이즈 예산 준수(gzip 경고 ≥ 300KB, 실패 > 450KB)

## 진행/이관 노트

- 과거 완료된 토큰/애니메이션/접근성/다운로드 1차 작업은 완료 로그로
  이관했습니다.
- 본 문서는 상기 Phase 1–7만 추적합니다.
