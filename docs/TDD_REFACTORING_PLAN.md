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

<!-- 0) 현재 상태 점검 요약: 완료 로그(TDD_REFACTORING_PLAN_COMPLETED.md)로 이관됨 -->

## 남은 작업(우선순위 및 순서)

> 경량화 목표: UX/기능 동등성 유지. 코드/스타일 중복 제거와 레거시 표면을
> 정리하고, 실행 경로를 단순화한다. Userscript 특성상 단일 번들이지만, “불필요한
> 코드 제거”와 “지연 실행(조건부 로딩)”, “디버그 제거”로 실측 크기·초기화 비용을
> 낮춘다.

<!-- Phase 3 — 비핵심 서비스 지연 실행(조건부 import) 및 경량화: 완료 항목으로 이관됨 → TDD_REFACTORING_PLAN_COMPLETED.md 참조 -->

롤백 전략: 각 단계는 독립 PR로 최소 diff 수행. 스캔/가드 테스트 GREEN 전제에서
진행하며, 실패 시 해당 커밋만 리버트 가능.

<!-- 부록(SOURCE PATH RENAME / CLEANUP PLAN): 완료 로그로 이관됨 -->

---

<!-- “초기 페인트 시 툴바 투명” 이슈는 완료되어 완료 로그(TDD_REFACTORING_PLAN_COMPLETED.md)로 이관되었습니다. 활성 계획에서는 제외합니다. -->

## Phase 4 — 런타임 라이프사이클 경화(Log-driven)

목표: X.com 실운영 로그(`x.com-*.log`) 기반으로 서비스/이벤트/렌더링
라이프사이클의 경계를 강화하고, 중복 초기화·재등록·경합을 제거한다. 모든 변경은
TDD로 진행하며, PC 전용 입력·벤더 getter 규칙을 준수한다.

참고 로그(발췌):

- [WARN] [CoreService] 서비스 덮어쓰기: toast.controller
- [WARN] EventManager가 파괴된 상태에서 addEventListener 호출
- [INFO] [GalleryRenderer] 최초 렌더링 시작 … / … 렌더링 완료 (짧은 간격의 반복)
- [DEBUG] Event listener added/removed … (짧은 간격 반복), useGalleryScroll:
  이벤트 리스너 등록/정리 반복

### 4.1 Core 서비스 재등록(덮어쓰기) 제거 — idempotent 등록 보장

- 문제: DEV 도구(ServiceDiagnostics)가 `registerCoreServices()`를 다시 호출하여
  이미 등록된 키(특히 `toast.controller`)가 재등록되며 “서비스 덮어쓰기” 경고
  발생.
- 원인: `main.initializeCriticalSystems()`에서 1차 등록 후,
  `initializeDevTools()` → `ServiceDiagnostics.diagnoseServiceManager()`가 다시
  `registerCoreServices()` 호출.
- 해결 옵션:
  - A) `registerCoreServices()` 내부에서 핵심 키(예: `MEDIA_SERVICE`) 존재 시
    no-op으로 단락(return) — 전체 idempotent 보장.
  - B) `ServiceDiagnostics`가 진단 전 `CoreService` 상태를 조회, 이미 등록된
    경우 재등록 생략.
  - C) 양쪽 모두 가드(중복 방지 이중 안전장치) — 테스트에서 회귀 방지에 유리.
- 선택: C (내부/외부 이중 가드). 변경 범위 최소, 회귀 저항성↑.
- 테스트(RED → GREEN):
  - unit: `registerCoreServices` 2회 호출 시 CoreService `register()`가 한 번만
    실등록되고, 덮어쓰기 로그가 발생하지 않는다.
  - unit: `ServiceDiagnostics.diagnoseServiceManager()` 호출 전후 등록 수 불변.
  - smoke: 앱 부팅 시 “[CoreService] 서비스 덮어쓰기” 로그 부재.
- 수용 기준: DEV/PROD 모두 중복 등록 0회, 진단 기능 정상 동작.

### 4.2 EventManager 파괴 후 재사용 경고 제거 — 훅 생명주기 수정

- 문제: `useGalleryScroll`에서 effect clean-up 시
  `eventManagerRef.current.cleanup()`으로 인스턴스를 파괴한 뒤, 동일 인스턴스로
  재등록을 시도하여 “파괴된 상태에서 addEventListener 호출” 경고 및 리스너
  미등록 발생.
- 원인: 훅 재실행(의존성 변화) 간에 ref 인스턴스를 재생성하지 않고, 동일 객체를
  재사용함. `cleanup()`은 영구 파괴 플래그를 세팅.
- 해결 옵션:
  - A) effect 스코프에 로컬 `const em = new EventManager()`를 생성/등록하고
    clean-up에서 해당 em만 정리(Ref 삭제).
  - B) clean-up 시 `eventManagerRef.current = new EventManager()`로 교체하고
    이전 인스턴스는 정리.
  - C) EventManager에 `reset()` 추가(파괴 상태 해제). — 서비스 계약이 불필요하게
    넓어짐.
- 선택: A (훅 내부 로컬 매니저 사용, 파괴-재사용 경로 제거). 추후 B는 대체
  전략으로 문서화.
- 테스트:
  - unit(JSDOM): `enabled` 토글/`container` 변경 반복 시 경고 로그 미발생,
    리스너 누수 0, 재등록 정상.
  - unit: `getEventListenerStatus().total`이 토글 전/후 동일 (±1 허용 없음).
  - styles/smoke: 스크롤 중단/차단 로직이 동일하게 작동(회귀 없음).
- 수용 기준: 경고 로그 0, 리스너 카운트 누수 0, 스크롤 UX 동일.

### 4.3 갤러리 렌더러 단일 인스턴스/등록 보장 — 중복 렌더/등록 가드

- 문제: 짧은 간격으로 “[GalleryRenderer] … 렌더링 완료” 로그가 중복 관찰. 또한
  `GalleryRenderer.ts`가 클래스 외에
  `export const galleryRenderer = new GalleryRenderer()`를 노출해 잠재적 이중
  인스턴스 생성 리스크.
- 원인 추정: (1) 신호 기반 open 상태 전이 시 렌더 트리거가 근접 호출, (2) 잘못된
  모듈 import로 별도 인스턴스 생성 가능성.
- 해결 옵션:
  - A) 모듈 수준 인스턴스 export 제거(팩토리/등록 전용으로 일원화), 등록은
    `main`에서만 수행.
  - B) `registerGalleryRenderer()`가 기존 등록 존재 시 no-op.
  - C) Renderer 내부 가드 보강(현재도 `isRenderingFlag || container`로 1차 방지)
    — 유지.
- 선택: A + B (생성·등록 단일 경로 보장). C는 유지.
- 테스트:
  - unit: `registerGalleryRenderer()` 2회 호출 시 1회만 유효 처리.
  - unit: 갤러리 open 1회 → “최초 렌더링 시작” 1회만 기록되는지 spy로 검증.
  - smoke: 초기화 경로에서 renderer 인스턴스 1개만 생성.
- 수용 기준: 렌더 시작/완료 로그 각 1회, 중복 렌더 없음.

### 4.4 이벤트 리스너 재배선(우선순위 강화) 과도 실행 감소

- 문제: `utils/events.ts`의 우선순위 강화 인터벌로 등록/해제가 잦음. 실 로그에서
  add/remove 빈번.
- 현상: 갤러리 열림 시 skip하지만, 평시에도 주기가 잦거나 조건이 완화되어 과도
  실행.
- 개선안:
  - A) 주기 상향(예: 15s → 30s) + 백오프(지속 실패 시 지수적 증가, 성공 시
    초기화).
  - B) 페이지 비가시/백그라운드 탭 시 중단(현행 유지) + 네트워크/프레임 바운드
    스로틀 추가.
  - C) 진단 모드에서만 상세 로그(레벨 debug 유지, default는 샘플링).
- 선택: A+B. 로그 레벨은 유지하되 샘플링 도입은 추후.
- 테스트:
  - unit: 인터벌 동작이 갤러리 open 상태에서 수행되지 않음(현행 유지).
  - perf: 모의 시간 진행으로 재등록 호출 횟수 상한 검증.
- 수용 기준: 평시 add/remove 로그 밀도 감소, 갤러리 열림 시 0회.

### 4.5 ToastController 단일 소스화 — Features 레이어 직접 생성 금지

- 문제: Features(`GalleryApp`)에서 `new ToastController()` 직접 생성. Core 등록
  인스턴스와 분리되어 추후 정책 불일치/중복 리소스 가능성.
- 해결 옵션:
  - A) Features는 컨테이너 accessor(`getToastController`)만 사용. 직접 생성
    금지.
  - B) 기존 코드는 유지하되, 컨테이너 등록 인스턴스와 동일한 매니저(통합
    `UnifiedToastManager`)로 위임 → 현재도 위임이므로 기능상 문제는 경미.
- 선택: A (정책 일치, 테스트 용이). 코드 수정은 최소 diff.
- 테스트:
  - unit: `GalleryApp` 초기화 시 Toast 인스턴스 생성이 컨테이너 경유 1회임을
    spy로 검증.
  - smoke: 토스트 표시 동작 회귀 없음.
- 수용 기준: 컨테이너 인스턴스 단일화, 덮어쓰기 로그 0.

### 4.6 스크롤/휠 리스너 단일화 — 중복 처리·재등록 최소화 (Log-driven)

- 문제: 런타임 로그에서 window/container/document에 대해 `scroll`/`wheel`
  리스너의 잦은 add/remove 및 중복 처리 로그가 관찰됨.
  - 소스 상 기여 지점: `features/gallery/hooks/useGalleryScroll`(document-level
    wheel, capture+passive:false),
    `shared/components/ui/Toolbar/Toolbar.tsx`(window scroll, raf-throttle),
    `shared/utils/animations.ts`의 `setupScrollAnimation`(target scroll).
  - 영향: 로그 노이즈, 이벤트 처리 경합 가능성, 성능 저하 위험.
- 해결 옵션:
  - A) 중앙 스크롤 관리자(ScrollEventHub) 도입: 단일 소스(document 또는 특정
    컨테이너)에서 수신 후 구독자에게 배포. 각 호출자는 구독만 수행, 직접
    addEventListener 금지.
  - B) 기존 구조 유지하되, 동일 타겟/타입 중복 등록 가드(EventManager 레벨
    de-dup)와 훅 레벨 “단 1회 등록” 보장(의존성 최소화, AbortController 사용)
    추가.
  - C) window scroll은 유지하고 container scroll은 금지(또는 반대로 정책
    일원화) + `setupScrollAnimation`은 내부적으로 이미 존재하는 리스너
    재사용(옵션 B의 부분집합).
- 선택: B 우선(최소 diff, 회귀 리스크↓), 필요 시 A는 후속 구조화 작업으로 고려.
  window vs container 정책은 “window 우선, container는 필요 시에만”으로 문서화.
- 구현 포인트(최소 diff):
  - EventManager: 동일 target/type/options/hash 중복 등록 방지(참조 동일성 또는
    key 기반). cleanup 시 카운트 정확성 유지.
  - useGalleryScroll: effect 당 로컬 EventManager(4.2 선택과 일치) +
    AbortController로 ‘휠 차단’ 보장. 트위터 컨테이너 wheel 차단은 컨테이너가
    유효할 때만 단 1회 등록하고 관찰 대상 변경 시에만 재등록.
  - setupScrollAnimation: 내부적으로 이미 존재하는 같은 target의 scroll 리스너를
    재사용하거나, 최소한 idempotent(같은 콜백/옵션이면 no-op) 가드 추가. 반환
    cleanup은 참조 카운팅 또는 단순 no-op로 안전하게 처리.

  현재 상태(진행 로그):
  - EventManager 레벨 de-dup/refcount 구현 및 단위 테스트 추가(GREEN).
  - setupScrollAnimation에 idempotency 가드(WeakMap 기반 refCount) 추가 및
    테스트 통과.
  - useGalleryScroll 훅은 effect-로컬 EventManager로 전환 완료(4.2 달성).

- 테스트(RED → GREEN):
  - unit: EventManager 중복 등록 방지 — 같은 target/type/options/callback으로
    2회 add 시 실제 DOM add는 1회만 호출(spy로 검증). remove 후에는 다시 1회 add
    허용.
  - unit(JSDOM): useGalleryScroll 켜고 끌 때 document의 wheel 리스너 총 개수
    불변(누수 0)이며, 토글 반복/컨테이너 교체에도 중복 등록 없음.
  - unit: setupScrollAnimation 같은 target에 동일 onScroll 전달 시 1회만
    등록되고, cleanup 두 번 호출해도 안전(no throw, 실제 remove 1회만 발생).
  - smoke: 휠 스크롤 중 ‘휠 이벤트 처리 완료’ 로그 빈도는 동일하되, add/remove
    로그 밀도는 현저히 감소.
- 수용 기준:
  - 스크롤/휠 리스너 add/remove 로그 밀도 체감(테스트에서는 호출수 상한으로
    보장), 중복 처리 로그 제거.
  - 리스너 누수 0, UX(휠 차단·방향 감지·툴바 대비 조정) 회귀 없음.

---

### 4.7 휠 스크롤 미동작 — 문서 레벨 등록의 container 의존 제거

- 문제: 갤러리 휠 스크롤이 동작하지 않는 사례에서, `useGalleryScroll`가 문서
  레벨의 `wheel` 리스너 등록을 `container` 존재 여부에
  의존(`if (!enabled || !container) return;`)하여, 컨테이너가 아직 준비되지 않은
  시점에는 리스너가 아예 등록되지 않음.
  - 관찰 로그: 짧은 간격으로 `scroll` add/remove가 반복되며, `wheel` 경로는
    미등록 상태 가능.
  - 영향: 초기 구간에서 휠 이벤트 무시, 갤러리 내 휠 스크롤 불가.

- 해결 옵션:
  - A) 문서(document) 레벨 `wheel` 등록을 `container`와 분리. `enabled`
    조건만으로 등록하고, 트위터 컨테이너 차단은 별도 효과에서 컨테이너가 준비된
    경우에만 수행.
    - 장점: 최소 diff, 즉시 원인 해소, 4.2/4.6과 정합적(EventManager de-dup로
      중복 방지).
    - 단점: 효과가 2개로 분리되어 의존성 관리가 약간 복잡해짐.
  - B) `scroll-utils.ensureWheelLock(document, handler)` 등 유틸을 사용해
    표준화된 경로로 등록.
    - 장점: passive=false/캡처 보장, 정책 위반 방지.
    - 단점: 현행(EventManager 기반) 경로와 이원화되어 추후 통합 필요.
  - C) window 레벨로 변경. — 팀 정책(문서 우선) 및 기존 설계와 불일치, 비선호.

- 선택: A (문서 레벨 등록은 항상 유효, 컨테이너 차단은 선택적). 필요 시 B는 추후
  일원화 작업에서 고려.

- 구현 포인트(최소 diff):
  - `useGalleryScroll`의 효과를 둘로 분리
    1. 문서 레벨 wheel 핸들러 등록/정리: 의존성
       `[enabled, handleGalleryWheel]`로 단순화
    2. 트위터 컨테이너 차단 등록/정리: 의존성
       `[enabled, blockTwitterScroll, preventTwitterScroll, container]`
  - 둘 다 effect-로컬 `EventManager` 사용(4.2 일관성), passive:false +
    capture:true 유지.
  - 컨테이너 미존재 시에도 문서 레벨 리스너는 항상 1회 등록됨(중복은
    EventManager de-dup이 방지).

- 테스트(RED → GREEN):
  - unit: `container=null`에서 `enabled=true`일 때도 문서 레벨 wheel 리스너가
    등록되고, wheel 이벤트 시 핸들러가 호출되며 `preventDefault()`가 가능(갤러리
    open일 때).
  - unit: `container`가 `null → element → null`로 변할 때 문서 레벨 리스너 수
    불변(누수/중복 0), 컨테이너 차단 리스너는 컨테이너 존재 시에만 등록.
  - unit: 토글/변경 반복에도 `document.addEventListener('wheel', …)` 실제
    호출수는 상한 내(중복 회피)이며, cleanup 후 재등록 시에도 정확히 1회 동작.

- 수용 기준:
  - 컨테이너 부재 시에도 휠 스크롤 동작(갤러리 open 상태에서 onScroll 콜백/방향
    감지 정상).
  - 로그에서 wheel 등록/제거의 불필요한 반복 감소(테스트에서는 호출 카운트로
    보장).
  - 리스너 누수 0, 정책(PC 전용 입력, vendors getter 경유) 준수.

---

### 4.8 휠 핸들링 완전 일원화 및 경계 고정 (완료)

- 목적: 모든 휠 처리 경로를 EventManager의 단일 API로 집결하고, 정책 테스트로
  강제.
- 구현:
  - EventManager에 addWheelListener/addWheelLock API 추가, 진단
    카운터(listeners/locks) 노출.
  - ensureWheelLock가 소비(true) 시 stopPropagation도 수행하도록 보강.
  - useGalleryScroll은 문서 레벨/컨테이너 레벨 모두 addWheelLock 사용, 핸들러는
    boolean 반환으로 소비 신호화.
  - scroll-utils는 utils→services 경계 위반 및 순환 의존을 방지하기 위해
    EventManager 의존 제거 → wheel 헬퍼(addWheelListener/ensureWheelLock) 직접
    사용으로 전환.
  - Policy 테스트 추가: EventManager.addEventListener('wheel', …) 금지.
- 결과:
  - fast/unit 스위트 GREEN, dev/prod 빌드 및 validate-build GREEN.
  - dependency-cruiser 순환 의존 오류 제거, utils→services 경계 테스트 GREEN.
  - 진단 카운터는 추후 운영 로그에 선택적 노출 가능.

### 일정/PR 단위

- PR-1: 4.1(idempotent 등록) + 4.5(Toast accessor 사용) — 서비스 경계 정리, 로그
  소거 효과 즉시.
- PR-2: 4.2(훅 생명주기 수정) — 스크롤 훅 리스너 경고 제거/누수 제로화.
- PR-3: 4.3(렌더러 단일화) — 인스턴스 경로 정리 및 등록 가드.
- PR-4: 4.4(우선순위 강화 튜닝) — 성능/로그 밀도 개선.
- PR-5: 4.6(스크롤/휠 단일화) — 중복 등록 가드 + 훅/유틸 idempotent 보강.

각 PR은 “실패 테스트 추가 → 최소 구현 → 리팩터링” 절차를 따르며, 다음 게이트를
모두 통과해야 한다.

- 품질 게이트: typecheck PASS · lint PASS · unit/smoke PASS · (선택) perf PASS
- 수용 기준(요약):
  - 덮어쓰기/파괴 후 등록 경고 로그 0
  - 렌더 시작/완료 로그 1회(각)
  - 이벤트 리스너 누수 0, 갤러리 열림 시 우선순위 강화 0회
  - 토스트 컨트롤러 단일 인스턴스 보장
