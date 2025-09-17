# TDD 리팩토링 활성 계획 (2025-09-17 갱신)

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

<!-- 2025-09-17 적용 사항 요약은 완료 로그(TDD_REFACTORING_PLAN_COMPLETED.md)로 이관했습니다. -->

## 남은 작업(우선순위 및 순서)

> 경량화 목표: UX/기능 동등성 유지. 코드/스타일 중복 제거와 레거시 표면을
> 정리하고, 실행 경로를 단순화한다. Userscript 특성상 단일 번들이지만, “불필요한
> 코드 제거”와 “지연 실행(조건부 로딩)”, “디버그 제거”로 실측 크기·초기화 비용을
> 낮춘다.

<!-- 완료된 항목(4.1/4.2/4.3/4.7/4.8/4.9/4.10/4.4.a)은 완료 로그로 이관됨 → TDD_REFACTORING_PLAN_COMPLETED.md 참조 -->
<!-- 추가로 4.x(Result 패턴 표준화)도 완료 로그로 이관했습니다. -->

롤백 전략: 각 단계는 독립 PR로 최소 diff 수행. 스캔/가드 테스트 GREEN 전제에서
진행하며, 실패 시 해당 커밋만 리버트 가능.

<!-- 부록(SOURCE PATH RENAME / CLEANUP PLAN): 완료 로그로 이관됨 -->

---

<!-- “초기 페인트 시 툴바 투명” 이슈는 완료되어 완료 로그(TDD_REFACTORING_PLAN_COMPLETED.md)로 이관되었습니다. 활성 계획에서는 제외합니다. -->

## Phase 4 — 런타임 라이프사이클 경화(Log-driven) — 활성 남은 항목만

목표: X.com 실운영 로그(`x.com-*.log`) 기반으로 서비스/이벤트/렌더링
라이프사이클의 경계를 강화하고, 중복 초기화·재등록·경합을 제거한다. 모든 변경은
TDD로 진행하며, PC 전용 입력·벤더 getter 규칙을 준수한다.

참고 로그(발췌):

- [WARN] [CoreService] 서비스 덮어쓰기: toast.controller
- [WARN] EventManager가 파괴된 상태에서 addEventListener 호출
- [INFO] [GalleryRenderer] 최초 렌더링 시작 … / … 렌더링 완료 (짧은 간격의 반복)
- [DEBUG] Event listener added/removed … (짧은 간격 반복), useGalleryScroll:
  이벤트 리스너 등록/정리 반복

목표: 이벤트/스크롤 경로의 과도 등록과 중복 실행을 더 줄여 dev/runtime 로그의
노이즈를 낮추고, 기능 회귀 없이 안정성을 높인다. 완료된 세부 항목은 완료 로그를
참조한다.

### 4.4 이벤트 리스너 재배선(우선순위 강화) 과도 실행 감소 — 메인 작업

- 계획: 우선순위 강화 인터벌의 상향/백오프 설정을 코드로 확정하고, 백그라운드
  탭/비가시 상태에서의 중단을 보장. 네트워크/프레임 바운드 스로틀을 추가 검토.
- 테스트(RED→GREEN):
  - perf/unit: 모의 시간 진행으로 재등록 호출 횟수 상한 검증(상한 값 고정),
    갤러리 open 시 0회 유지.
- 수용 기준: 평시 add/remove 로그 밀도 추가 감소, 정책/가드 테스트 GREEN.

### 4.4 이벤트 리스너 재배선(우선순위 강화) 과도 실행 감소 — 메인 작업

- 계획: 우선순위 강화 인터벌의 상향/백오프 설정을 코드로 확정하고, 백그라운드
  탭/비가시 상태에서의 중단을 보장. 네트워크/프레임 바운드 스로틀을 추가 검토.
- 테스트(RED→GREEN):
  - perf/unit: 모의 시간 진행으로 재등록 호출 횟수 상한 검증(상한 값 고정),
    갤러리 open 시 0회 유지.
- 수용 기준: 평시 add/remove 로그 밀도 추가 감소, 정책/가드 테스트 GREEN.

### 4.6b ScrollEventHub 계약 테스트 보강 — 후속

- 계획: `useGalleryScroll` 토글/컨테이너 교체/AbortSignal 경계에서의 계약
  테스트를 보강하고, utils→services 경계 준수를 지속 검증.
- 테스트(RED→GREEN):
  - unit: container가 null→element(Shadow 포함)→null로 변해도 문서 레벨 리스너
    수 불변(중복/누수 0), 동일 파라미터 2회 add는 DOM 1회, abort 시 자동 해제.
- 수용 기준: 리스너 누수 0, add/remove 로그 밀도 유지 또는 감소, 정책 준수
  GREEN.

<!-- 4.x(Result 패턴 표준화) 완료: 완료 로그로 이관 -->

---

<!-- 4.7/4.8/4.9/4.10 관련 구현/결과/PR 메모는 완료 로그로 이관 -->

<!-- 4.8/4.9/4.10 상세 설계/테스트는 완료 로그에 보존합니다. 활성 계획에서는 제외합니다. -->
