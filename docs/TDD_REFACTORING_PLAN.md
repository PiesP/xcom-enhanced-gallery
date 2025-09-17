# TDD 리팩토링 활성 계획 (2025-09-16 갱신)

> 목표: 충돌/중복/분산·레거시 코드를 줄이고, 아키텍처·토큰·입력 정책 위반을
> 테스트로 고정하며, UI/UX 일관성과 안정성을 높인다. 모든 변경은 실패 테스트 →
> 최소 구현 → 리팩토링 순으로 진행한다.

- 근거 문서: `docs/ARCHITECTURE.md`, `docs/CODING_GUIDELINES.md`,
- 환경: Vitest + JSDOM, 기본 URL https://x.com, vendors/userscript는
- 공통 원칙: 최소 diff, 3계층 단방향(Features → Shared → External), PC 전용
  입력, CSS Modules + 디자인 토큰만

---

<!-- 0) 현재 상태 점검 요약: 완료 로그(TDD_REFACTORING_PLAN_COMPLETED.md)로 이관됨 -->

## 남은 작업(우선순위 및 순서)

> 경량화 목표: UX/기능 동등성 유지. 코드/스타일 중복 제거와 레거시 표면을
> 정리하고, 실행 경로를 단순화한다. Userscript 특성상 단일 번들이지만, “불필요한
> 코드 제거”와 “지연 실행(조건부 로딩)”, “디버그 제거”로 실측 크기·초기화 비용을
> 낮춘다.

- 상태: 완료 — 상세 내역은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조
- 요약: startup import/eval 가드 테스트 추가, BulkDownload 즉시 import 제거,
  main.ts 초기화 경로 정리, ThemeService/FilenameService 지연 초기화 전환 현재
  활성 계획에는 Phase 3 관련 남은 작업이 없습니다. 추가 관찰/미세 조정이 필요할
  경우 별도 이슈로 추적합니다.

롤백 전략: 각 단계는 독립 PR로 최소 diff 수행. 스캔/가드 테스트 GREEN 전제에서

## <!-- 부록(SOURCE PATH RENAME / CLEANUP PLAN): 완료 로그로 이관됨 -->

<!-- “초기 페인트 시 툴바 투명” 이슈는 완료되어 완료 로그(TDD_REFACTORING_PLAN_COMPLETED.md)로 이관되었습니다. 활성 계획에서는 제외합니다. -->

## 신규 계획 — 휠 스크롤 누수·이벤트 과다 문제 해결 (2025-09-17 추가)

- 증상 1: 갤러리에서 표시 중인 미디어 높이가 뷰포트보다 작은 경우, 마우스 휠
  이벤트가 X/Twitter 배경 페이지로 전달되어 배경이 스크롤됨(“스크롤 누수”).
- 증상 2: 콘솔에서 이벤트 리스너 add/remove가 빈번히 발생하며, 파괴된
  EventManager 이후의 add 시도 경고가 관찰됨(“이벤트 과다/수명 문제”).

원인 가설(확률 높은 순)

시 preventDefault가 적용되지 못함. 또는 ensureWheelLock가 올바른 대상 요소에
적용되지 않음. 않음(갤러리 루트/스크롤 컨테이너 분리 시 누락 가능성). 3. 수명:
갤러리 열림/닫힘 또는 재마운트 시, 컨텍스트 가드 없이 리스너를 반복

보증.

- 장점: 구현 간단, 레이아웃 영향 최소.
- 단점: 컨테이너가 스크롤 불가(미디어 < 뷰포트)일 때 휠 이벤트 자체는 여전히
  전파될 수 있어 누수 완전 차단 보장 어려움.
- B. 컨테이너 수준 휠 락: 갤러리 루트에 ensureWheelLock(passive=false) 적용,
  “갤러리 오픈 중 + 필요 조건”에서 true 반환하여 preventDefault.
  - 장점: 확정적으로 이벤트 소비, 뷰포트 대비 콘텐츠 작을 때도 누수 차단.
  - 단점: non-passive 휠 리스너(최소 범위로 제한 필요). 성능 영향은 미미하나
    정책적으로 최소화가 필요.
- C. 문서 캡처 휠 가드: document 캡처 단계에서 갤러리 내부 타깃 시 즉시 소비.
  - 장점: 트위터 동적 리스너보다 먼저 개입 보장.
  - 단점: 범위가 넓어 침습적, 불필요한 경로까지 가로챌 우려. 유지보수 부담.
- D. 수명/컨텍스트 가드 강화: 단일 컨텍스트당 단 1회 등록 보장, AbortController
  로 라이프사이클 스코핑. 파괴 이후 호출 경로 차단(경고 제거).
  - 장점: 이벤트 과다/중복 제거, 경고 제거, 디버깅/검증 용이.
  - 단점: 도입 시 호출부 일부 리팩토링 필요.

선택안(조합)

- B + D를 1차 적용, A는 보강(누락 지점 보증), C는 불필요하여 배제.
  - 갤러리 루트 컨테이너에 ensureWheelLock(element, handler, { passive:false
    })를 사용. handler는 “갤러리 오픈 중이고, 배경 스크롤을 허용하지 않는
    조건”에서 true를 반환해 소비. 조건에는 (a) 미디어 높이 < 뷰포트, (b) 갤러리
    내에서 별도 스크롤 대상이 없음 등의 단순화된 판정을 사용.
  - EventManager/GalleryEvent 초기화에 idempotent 가드 + AbortController 스코프
    도입. 파괴 이후 add를 거부하고, 컨텍스트 중복 등록 방지.

수용 기준(테스트 우선)

- T1. 갤러리 오픈 상태에서 휠 이벤트가 배경(document/body) 스크롤을 유발하지
  않는다(미디어가 뷰포트보다 작아도). ensureWheelLock handler가 true를 반환할 때
  preventDefault가 호출되는 것을 단위 테스트로 확인.
- T2. 갤러리 열고 닫는 3회 순환 동안, 동일 컨텍스트의 휠/키/클릭 리스너 등록
  수가 1을 초과하지 않는다(중복 등록 없음).
  getGalleryEventStatus()/getUnifiedStatus() 기준.
- T3. EventManager 파괴 이후 add 호출 시 새로운 리스너가 등록되지 않으며, 경고는
  1회만 기록되고 실제 카운트가 증가하지 않는다.
- T4. CSS overscroll-behavior가 갤러리 루트/스크롤 컨테이너에 적용되어 있는지
  정적 테스트로 검증(styles project).
- 성능 가드: non-passive 휠 리스너는 갤러리 오픈 중·컨테이너 한정으로만 존재.
  TDD 단계(RED → GREEN → 리팩터)

1. RED — 테스트 추가
   - test/fast/shared/wheel-lock.test.ts
     - ensureWheelLock가 handler=true에서 preventDefault 호출하는지 검증.
   - test/unit/shared/event-manager-lifecycle.test.ts 증가시키지 않는지, 경고
     1회만 발생하는지.
   - test/phases/phase-…/gallery-scroll-containment.spec.ts
     - 갤러리 오픈 시 배경 스크롤 차단(통합): 갤러리 루트에
       preventScrollPropagation 활성화 여부(스파이) 및 문서 스크롤 증가 유무
   - test/styles/overscroll-containment.test.ts
     - CSS Modules 빌드 산출물에서 갤러리 컨테이너에 overscroll-behavior:
       contain 존재 확인.

2. GREEN — 최소 구현
   - preventScrollPropagation(element, { disableBodyScroll: true })를 디폴트
   - features/gallery/\* (컨테이너 렌더러)
     - 갤러리 루트 컨테이너 마운트 시 ensureWheelLock 적용, 언마운트에서 정리.
     - “갤러리 오픈 중 + 필요조건” 판정 유틸 도입(간단 비교: clientHeight <
     - add 시 파괴 가드, 동일 컨텍스트 중복 등록 방지(이미 등록된 id 추적 혹은
       컨텍스트 조회 후 removeByContext로 정리 후 1회만 등록), AbortController
       기반 전체 정리.

     shared/services/input/WheelLockController.ts
     - contract: attach(container, opts) → detach(), isActive(), stats()

   - 문서화: CODING_GUIDELINES.md에 “휠 정책” 추가(기본 passive, 락은 컨테이너
     한정/오픈 중에만, preventDefault는 명시적 true 반환 조건에서만).

변경 범위(최소 diff)

- 코드
  - shared/utils/scroll/scroll-utils.ts: preventScrollPropagation 개선(또는
    호출부 강화) 및 createScrollHandler 주석/가드 추가.
  - features/gallery/\*: 갤러리 루트에 ensureWheelLock 설치·해제. 기존 passive
    wheel listener와 역할 분리.
  - shared/services/EventManager.ts, shared/utils/events.ts: 수명/컨텍스트 가드,
    상태/통계 노출 개선.
- 테스트
  - test/fast/shared/wheel-lock.test.ts
  - test/unit/shared/event-manager-lifecycle.test.ts
  - test/phases/gallery-scroll-containment.spec.ts
  - test/styles/overscroll-containment.test.ts
- 스타일
  - 갤러리 루트/스크롤 컨테이너 CSS Modules에 overscroll-behavior: contain 보증
    (누락 시 추가). 디자인 토큰 규칙 유지.

롤백/완충

- 갤러리 기능이 회귀하는 경우, ensureWheelLock 연결을 feature flag로 토글 가능
  하게 준비(xeg:wheel-lock=off). 테스트는 flag off에서도 기본 동작 유지 가드.
- 비정상 중단 시, C 옵션(document 캡처)은 비상 플랜으로 별도 브랜치에서 실험.

메트릭/검증

- 품질 게이트: npm run validate, test:smoke/fast/unit/styles GREEN.
- 런타임 스모크: playwright/playwright.config.ts의 smoke 스펙을 확장하여 갤러리
  오픈 상태에서 배경 스크롤이 변하지 않는지 확인(선택: 후속 PR).

비고

- 외부 라이브러리 직접 import 금지: vendors getter 규칙 유지.
- PC 전용 입력만 사용. 터치/포인터 이벤트 추가 금지(테스트로 RED 처리됨).
- 최소 diff 원칙 준수. 호출부에서만 ensureWheelLock 추가, 기존 API 호환 유지.

### 진행 상태 (2025-09-17) — GREEN

- 구현
  - GalleryContainer에 컨테이너 수준 ensureWheelLock 설치(capture:true,
    passive:false). 컨테이너가 스크롤 불가 시 휠 소비.
  - useGalleryScroll 훅: 문서 레벨 휠 리스너를 항상 등록하되, 갤러리 열림 여부는
    전역 signal(galleryState.value.isOpen)로 판정하여 런타임에만 소비. 최신
    onScroll/block 옵션은 ref로 참조.
  - 수명 가드: EventManager 인스턴스는 effect 수명 내에서만 생성/cleanup. 파괴
    후 재사용 방지.
  - CSS overscroll-behavior는 기존 스타일 정책과 테스트로 보강 유지.
- 테스트 추가
  - test/unit/shared/components/isolation/GalleryContainer.wheel-lock.contract.test.tsx
    — 컨테이너 스크롤 가능/불가에 따른 휠 소비 계약 검증.
  - test/unit/features/gallery/hooks/useGalleryScroll.integration.test.tsx —
    갤러리 닫힘 시 문서 휠 비차단, 열림 시 차단, 닫은 뒤 다시 비차단.
- 결과
  - 전체 fast/unit/styles 스위트 GREEN (126 files passed, 0 failed 시점 기준).
    신규 통합 테스트 포함 GREEN 확인.
  - 수용 기준 T1/T4 충족. T2/T3는 기존 EventManager 가드 테스트와 main
    idempotency 스위트로 커버되며 회귀 없음 확인.
