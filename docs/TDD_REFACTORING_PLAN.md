# TDD 리팩토링 활성 계획 (2025-09-16 갱신)

> 목표: 충돌/중복/분산·레거시 코드를 줄이고, 아키텍처·토큰·입력 정책 위반을
> 테스트로 고정하며, UI/UX 일관성과 안정성을 높인다. 모든 변경은 실패 테스트 →
> 최소 구현 → 리팩토링 순으로 진행한다.

- 근거 문서: `docs/ARCHITECTURE.md`, `docs/CODING_GUIDELINES.md`,
  `docs/DEPENDENCY-GOVERNANCE.md`
- 환경: Vitest + JSDOM, 기본 URL https://x.com, vendors/userscript는
  getter/adapter로 모킹
- 공통 원칙: 최소 diff, 3계층 단방향(Features → Shared → External), PC 전용
  입력, CSS Modules + 디자인 토큰만

---

<!-- 0) 현재 상태 점검 요약: 완료 로그(TDD_REFACTORING_PLAN_COMPLETED.md)로 이관됨 -->

## 남은 작업(우선순위 및 순서)

> 경량화 목표: UX/기능 동등성 유지. 코드/스타일 중복 제거와 레거시 표면을
> 정리하고, 실행 경로를 단순화한다. Userscript 특성상 단일 번들이지만, “불필요한
> 코드 제거”와 “지연 실행(조건부 로딩)”, “디버그 제거”로 실측 크기·초기화 비용을
> 낮춘다.

### Phase 3 — 비핵심 서비스 지연 실행(조건부 import) 및 경량화

- 배경: 단일 번들이지만, 즉시 실행 비용을 낮추면 초기 체감속도가 개선됨
- 작업:
  - 다운로드/ZIP/설정/진단 관련 서비스는 이벤트 시점까지 import/초기화를 지연
    - 예: BulkDownloadService/zip creator/ServiceDiagnostics/Settings 로딩 지연
  - main.ts의 initializeNonCriticalSystems/initializeToastContainer 경계 검토 →
    불필요 선행 초기화 제거
  - 테스트 추가: `test/performance/startup-latency.test.ts`
    - 갤러리 미개시 상태의 초기 작업(타이머/리스너 수) 상한 가드
- 수용 기준: 갤러리 미사용 시 초기 타이머/리스너 수 감소, 기능 회귀 없음
- 이득: 초기화 비용/메모리 풋프린트 감소

메모(준비):

- 초기 후보(Non-Critical): ThemeService 초기화 지연, BulkDownloadService
  컨테이너 등록 시점 지연(기능 트리거 시), FilenameService 지연
- 테스트(RED): startup 시 import/eval 스캔으로
  BulkDownload/ZIP/Settings/Diagnostics 모듈의 즉시 평가 방지 확인

> 참고: 현재 활성 과제는 Phase 3만 남아 있습니다. Phase 4–6은 완료
> 로그(TDD_REFACTORING_PLAN_COMPLETED.md)에 기록됨.

롤백 전략: 각 단계는 독립 PR로 최소 diff 수행. 스캔/가드 테스트 GREEN 전제에서
진행하며, 실패 시 해당 커밋만 리버트 가능.

<!-- 부록(SOURCE PATH RENAME / CLEANUP PLAN): 완료 로그로 이관됨 -->
