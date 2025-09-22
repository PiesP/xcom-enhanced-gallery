# xcom-enhanced-gallery 문서 안내서

이 폴더는 프로젝트의 단일 소스 오브 트루스(SSOT)로, 각 문서는 하나의 책임만
갖도록 구성했습니다. 상세 규칙은 중복 없이 한 곳에서만 정의하고, 나머지는 링크로
연결합니다.

## 문서 맵

- 아키텍처와 경계: `ARCHITECTURE.md`
  - 레이어 구조, 의존 방향, 부트스트랩 흐름, 통합 지점(벤더/Userscript/ZIP)
- 코딩 가이드라인: `CODING_GUIDELINES.md`
  - 집행 가능한 규칙(타입스크립트/임포트/벤더 getter/PC 전용 입력/디자인
    토큰/TDD)
- Vendors 안전 API: `vendors-safe-api.md`
  - 외부 라이브러리/Userscript 접근을 위한 getter/adapter 계약,
    사용/모킹/안티패턴
- TDD 리팩토링 활성 계획: `TDD_REFACTORING_PLAN.md`
  - 현재 진행 중인 Epic/작업과 해당 Acceptance만 기록(일반 규칙/게이트는 코딩
    가이드/AGENTS로 위임)

보조 산출물

- 의존성 그래프: `dependency-graph.(svg|json|dot|html)`
- 히스토리/아카이브: `archive/` 및 Completed/Backlog 문서

## 실행/CI/검증 문서

- 개발/스크립트/CI 파이프라인은 저장소 루트의 `AGENTS.md`를 참조하세요.
- Userscript 빌드 산출물 검증은 `scripts/validate-build.js`가 수행합니다.

---

문서 변경 시에는 관련 테스트/스크립트 링크를 함께 갱신하여 링크 부패를 방지해
주세요.
