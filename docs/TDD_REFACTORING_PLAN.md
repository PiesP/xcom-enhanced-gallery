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

## 2025-09-17 적용 사항 요약(실행/검증 완료)

- 갤러리 휠 스크롤 미동작 이슈를 해결(4.7/4.9/4.10 수용 기준 충족)
  - 문서 레벨 wheel 등록을 컨테이너 의존에서 분리(항상 등록), 내부/외부 소비
    조건을 명확화, Shadow DOM 환경에서 `composedPath` 기반 판정 적용
  - 컨테이너 참조 안정화(컴포넌트에서 ref resolving 후 안정 참조를 훅에 전달)
  - 스크롤 가능 컨테이너 강제 셀렉터 하드닝(`ensureGalleryScrollAvailable`)
- 선택적 서비스 조회 경고 소거: `ServiceManager.tryGet`의 누락 로그를 debug로
  하향(실런타임 노이즈 감소)
- 품질 게이트: 타입/린트/테스트/개발 빌드 GREEN 확인
  - Tests: 582 passed, 2 skipped, 1 todo (fast/unit 스위트 GREEN)
  - Build(dev): Userscript 생성, sourcemap 생성, 산출물 검증 통과

<!-- 0) 현재 상태 점검 요약: 완료 로그(TDD_REFACTORING_PLAN_COMPLETED.md)로 이관됨 -->

## 남은 작업(우선순위 및 순서)

> 경량화 목표: UX/기능 동등성 유지. 코드/스타일 중복 제거와 레거시 표면을
> 정리하고, 실행 경로를 단순화한다. Userscript 특성상 단일 번들이지만, “불필요한
> 코드 제거”와 “지연 실행(조건부 로딩)”, “디버그 제거”로 실측 크기·초기화 비용을
> 낮춘다.

<!-- 완료된 항목(4.1/4.2/4.3/4.7/4.8/4.9/4.10/4.4.a)은 완료 로그로 이관됨 → TDD_REFACTORING_PLAN_COMPLETED.md 참조 -->

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

  ## Phase 4 — 런타임 라이프사이클 경화(Log-driven) — 활성 남은 항목만

  목표: 이벤트/스크롤 경로의 과도 등록과 중복 실행을 더 줄여 dev/runtime 로그의
  노이즈를 낮추고, 기능 회귀 없이 안정성을 높인다. 완료된 세부 항목은 완료
  로그를 참조한다.

  ### 4.4 이벤트 리스너 재배선(우선순위 강화) 과도 실행 감소 — 메인 작업
  - 계획: 우선순위 강화 인터벌의 상향/백오프 설정을 코드로 확정하고, 백그라운드
    탭/비가시 상태에서의 중단을 보장. 네트워크/프레임 바운드 스로틀을 추가 검토.
  - 테스트(RED→GREEN):
    - perf/unit: 모의 시간 진행으로 재등록 호출 횟수 상한 검증(상한 값 고정),
      갤러리 open 시 0회 유지.
  - 수용 기준: 평시 add/remove 로그 밀도 추가 감소, 정책/가드 테스트 GREEN.

  ### 4.5 ToastController 단일 소스화 — Features 레이어 직접 생성 금지
  - 계획: Features(`GalleryApp`)는 컨테이너 accessor(`getToastController`)만
    사용하도록 보장. 직접 생성 경로가 존재하지 않는지 스캔/테스트로 고정.
  - 테스트(RED→GREEN):
    - unit: `GalleryApp` 초기화 시 컨테이너 경유 1회 생성임을 spy로 검증.
    - lint: `new ToastController()` 직접 사용 금지 스캔.
  - 수용 기준: 컨테이너 인스턴스 단일화, 덮어쓰기/중복 경고 0.

  ### 4.6 스크롤/휠 리스너 단일화 — 중복 처리·재등록 최소화
  - 계획: EventManager 레벨 중복 등록 no-op 가드 및 훅/유틸 idempotent 보강을
    코드/테스트로 확정. ScrollEventHub는 feature flag로 유지하며 계약 테스트를
    보완.
  - 테스트(RED→GREEN):
    - unit: 같은 target/type/옵션/콜백으로 2회 add 시 실제 DOM add 1회, remove
      후 재등록 1회.
    - unit(JSDOM): `useGalleryScroll` 토글/컨테이너 교체 반복에도 누수/중복 0.
    - unit: ScrollEventHub 계약 테스트 강화.
  - 수용 기준: add/remove 로그 밀도 감소, 리스너 누수 0, 정책 준수.

---

### 4.8 휠 핸들링 완전 일원화 및 경계 고정 (완료)

    구현/상태(2025-09-17):

    - handleGalleryWheel의 소비 조건을 “갤러리 외부일 때만 true”로 조정, 외부 차단 유지
    - Shadow DOM 재타깃팅 보정을 위해 `isEventInsideContainer(event, container)`를 사용하여 composedPath 기반 내부 판정 적용
    - 스크롤 가능 컨테이너가 누락되지 않도록 `ensureGalleryScrollAvailable`의 셀렉터를 확장(`[data-xeg-role="items-container"]`, `[data-xeg-role-compat="items-list"]`, `.itemsContainer` 등)
    - 관련 단위 테스트(useGalleryScroll.twitter-consumption / dom.event-inside-container 등) GREEN, 개발 빌드 산출물 점검 및 런타임 로그 노이즈 감소 확인

- 목적: 모든 휠 처리 경로를 EventManager의 단일 API로 집결하고, 정책 테스트로
  강제.
- 구현:
  - EventManager에 addWheelListener/addWheelLock API 추가, 진단
    카운터(listeners/locks) 노출.
  - useGalleryScroll은 문서 레벨/컨테이너 레벨 모두 addWheelLock 사용, 핸들러는
  - scroll-utils는 utils→services 경계 위반 및 순환 의존을 방지하기 위해
    EventManager 의존 제거 → wheel 헬퍼(addWheelListener/ensureWheelLock) 직접
    사용으로 전환.
- 결과:
  - fast/unit 스위트 GREEN, dev/prod 빌드 및 validate-build GREEN.
  - dependency-cruiser 순환 의존 오류 제거, utils→services 경계 테스트 GREEN.
  - 진단 카운터는 추후 운영 로그에 선택적 노출 가능.

  소거 효과 즉시.

- PR-2: 4.2(훅 생명주기 수정) — 스크롤 훅 리스너 경고 제거/누수 제로화.
- PR-3: 4.3(렌더러 단일화) — 인스턴스 경로 정리 및 등록 가드.
- PR-5: 4.6(스크롤/휠 단일화) — 중복 등록 가드 + 훅/유틸 idempotent 보강.

각 PR은 “실패 테스트 추가 → 최소 구현 → 리팩터링” 절차를 따르며, 다음 게이트를
모두 통과해야 한다.

- 품질 게이트: typecheck PASS · lint PASS · unit/smoke PASS · (선택) perf PASS
- 수용 기준(요약):
  - 덮어쓰기/파괴 후 등록 경고 로그 0
  - 이벤트 리스너 누수 0, 갤러리 열림 시 우선순위 강화 0회
  - 토스트 컨트롤러 단일 인스턴스 보장

  ### 4.9 휠 스크롤 미동작(문서 캡처 과다 소비) 고치기 — 소비 범위의 조건화

  배경(현상/로그):
  - Dev 빌드 산출물(`dist/xcom-enhanced-gallery.dev.user.js`)과 런타임 로그를
    점검한 결과, 갤러리가 열린 상태에서 문서(document) 레벨 `wheel` 리스너가
    캡처 단계에서 동작하며, 항상 소비(true 반환 → `preventDefault()` +
    `stopPropagation()`)하는 경로가 존재. 반환하여 기본 스크롤을 차단. 이로 인해
    갤러리 내부 스크롤 컨테이너(overflow: auto)의 기본 스크롤까지 함께 차단되어
    “마우스 휠 스크롤이 동작하지 않는” 증상이 발생할 수 있음.
  - 스타일 상으로는 컨테이너/아이템 래퍼에 `overflow: auto` 및
    `preventDefault`로 막히면 효과가 없음.

  원인 요약:
  - 문서 레벨
    `ensureWheelLock(document, handleGalleryWheel, { capture: true })`로 등록된
    핸들러가 갤러리 내부/외부를 구분하지 않고 무조건 `true`를 반환해 이벤트를
    소비함. 캡처 단계에서의 `preventDefault()`는 대상 컨테이너의 기본 스크롤까지

  - A) 소비 조건을 ‘갤러리 외부’로 한정: `container?.contains(event.target)`일
    때는 `false`(미소비), 그 외에는 `blockTwitterScroll` 정책에 따라
    `true`(소비). 부합.
    - 단점: `container`가 준비되기 전 초기 구간에서는 여전히 문서 레벨에서
      소비가 일어날 수 있음 (초기 구간에서 내부 스크롤 요구가 거의 없으므로 수용
      가능).
  - B) 문서 레벨 리스너 제거, 트위터 컨테이너에만 `ensureWheelLock` 적용.
    - 장점: 소비 범위가 명확(페이지 컨테이너 한정).
  - C) 프로그램 방식 스크롤(onScroll에서 수동으로 `scrollTop += delta`)로 전환.
    - 장점: 일관된 스크롤 제어.
    - 단점: 자연스러운 스크롤/관성/스크롤바 동작과 괴리, 유지보수 복잡도↑.
  - D) CSS만으로 해결(overscroll-behavior 강화 등).

    구현/상태(2025-09-17):
    - composedPath 기반 판정으로 Shadow DOM 환경에서도 갤러리 내부 스크롤 정상
      동작
    - 문서 레벨 리스너 등록 구조 유지, 트위터 컨테이너 잠금도 기존 로직 유지
    - 관련 단위 테스트(useGalleryScroll.shadow-dom / event.composed-path 등)
      GREEN, 이벤트 리스너 누수/중복 0 확인 선택(최적안): A — 문서 레벨 캡처는
      유지하되, 소비(true) 조건을 “갤러리 외부”로 한정.

  구현 포인트(최소 diff, 정책 준수):
  - `useGalleryScroll.handleGalleryWheel(event)`에서 다음 조건 분기 적용
    - if (!isGalleryOpen) return false
    - const inGallery = container && container.contains(event.target as Node)
    - if (inGallery) return false // 내부 스크롤은 기본 동작 허용(미소비)
    - else if (blockTwitterScroll) return true // 갤러리 외부(트위터 페이지)
      스크롤 차단
    - else return false
  - 문서 레벨 리스너 등록은 현행대로 유지(4.7에서 분리된 구조). 컨테이너 준비
    여부와 무관하게 동작.
  - 트위터 컨테이너 차단 효과(`findTwitterScrollContainer()`)는 보조로 유지.
  - PC 전용 입력, vendors getter, EventManager API 사용 준수.

  테스트(RED → GREEN):
  - unit(JSDOM):
    - 케이스1: 갤러리 open + `event.target`이 갤러리 컨테이너 내부 → 핸들러가
      `false`를 반환, `preventDefault`가 호출되지 않음(기본 스크롤 허용). 내부
      스크롤 컨테이너의 `scrollTop` 변화 검증.
    - 케이스2: 갤러리 open + `event.target`이 갤러리 외부(트위터 페이지 영역) →
      핸들러가 `true`를 반환, `preventDefault`/`stopPropagation`이 호출됨(페이지
      스크롤 차단).
    - 케이스3: 갤러리 closed → 핸들러가 소비하지 않음.
  - unit: 문서 레벨 리스너 수 불변(토글/컨테이너 교체 반복 시 중복 등록/누수 0 —

### 4.10 휠 스크롤 미동작(Shadow DOM 재타깃팅) — inGallery 판정 보강

배경(실운영 관찰/산출물 근거):

- 런타임 로그에 “Shadow DOM container initialized”가 기록되며, 갤러리는 Shadow
  DOM 내부에 렌더링됨.
- 문서(document) 레벨 캡처 단계에서 휠을 처리할 때, Shadow DOM의 이벤트
  재타깃팅(retargeting)으로 인해 `event.target`이 Shadow host로 노출되어 내부
  컨테이너(`containerRef.current`)에 대한 `container.contains(event.target)`
  판정이 항상 `false`가 될 수 있음.
- 그 결과, “갤러리 내부이면 소비하지 않음” 가드가 동작하지 않고 외부로 오인되어
  `preventDefault()`가 호출되어 기본 스크롤이 차단 → “마우스 휠 스크롤이
  동작하지 않음” 증상.

원인 요약:

- Shadow DOM 환경에서 document 레벨 리스너가 관측하는 `event.target`은
  retarget된 값(대개 Shadow host)으로, ShadowRoot 내부 실제 타깃과 불일치.
- 단순 `container.contains(event.target as Node)` 판정은 Shadow 경계에서 실패.

해결 옵션 비교:

- A) composedPath 기반 inGallery 판정: `event.composedPath()`를 사용해 경로에
  컨테이너(또는 그 조상)가 포함되는지 검사. 보조로 선택자
  기반(`isGalleryElement`/`isGalleryContainer`) 매칭을 병행.
  - 장점: 최소 diff, Shadow 경계 투과 지원, 표준 API.
  - 단점: 일부 구형/폴리필 환경에서 `composedPath` 미지원 시 폴백 필요.
- B) 리스너 타깃을 ShadowRoot로 변경: 문서 레벨 대신 ShadowRoot에
  `ensureWheelLock` 등록.
  - 장점: retargeting 영향 최소화.
  - 단점: 컨테이너 생성/파괴 타이밍 의존, 갤러리 다중 인스턴스 고려 복잡도↑.
- C) 문서 레벨 유지 + Shadow host 식별 후 host→shadowRoot 매핑을 통해 내부 판정.
  - 장점: 동작 보장.
  - 단점: host 추적/매핑 코드가 환경 의존적이며 복잡.
- D) 문서 레벨 휠 잠금 제거(트위터 컨테이너만 잠금).
  - 장점: 단순.
  - 단점: X.com DOM 변경 취약, 페이지 스크롤 차단 신뢰성 저하.

선택(최적안): A — composedPath 기반 inGallery 판정 + 선택자 보조.

구현 포인트(최소 diff/정책 준수):

- `useGalleryScroll` 내 두 지점의 내부 판정 교체
  - `preventTwitterScroll(event)`와 `handleGalleryWheel(event)`에서
    - 기존:
      `const inGallery = !!(container && target && container.contains(target))`
    - 변경: `const inGallery = isEventInsideContainer(event, container)`
- 헬퍼 추가(Shared utils로 배치):
  - `isEventInsideContainer(evt: Event, container: HTMLElement): boolean`
    - 우선 `evt.composedPath?.()`에서 컨테이너 또는 컨테이너 하위 노드가
      존재하는지 검사.
    - 폴백: `(evt.target as Node | null)`에서 `Node.getRootNode()`를 따라
      올라가며 ShadowRoot 내부 탐색, 또는 선택자 기반(`data-xeg-gallery`,
      `[data-xeg-role="items-container"]` 등)으로 경로 상 갤러리 요소 존재 여부
      판단.
- 문서 레벨 리스너 등록 구조(4.7 선택 A)는 유지. 트위터 컨테이너 잠금도 기존
  로직 유지.
- PC 전용 입력/벤더 getter/EventManager API 정책 준수.

테스트(RED → GREEN):

- unit(JSDOM, Shadow DOM 지원 전제):
  - 케이스1: 갤러리 open + ShadowRoot 내부 요소를 `event.target`로 하는 wheel
    이벤트 → `inGallery === true`, 문서 레벨 핸들러는 `false` 반환,
    `preventDefault()` 미호출, 내부 스크롤 컨테이너 `scrollTop` 증가.
  - 케이스2: 갤러리 open + 갤러리 외부(트위터 영역)에서의 wheel → `true` 반환,
    `preventDefault()`/`stopPropagation()` 호출(페이지 스크롤 차단).
  - 케이스3: 갤러리 closed → 소비하지 않음.
- unit: `container`가 `null → element(Shadow) → null`로 변해도 문서 레벨 리스너
  수 불변(중복/누수 0), 트위터 컨테이너 잠금은 컨테이너 존재 시에만 등록.

수용 기준:

- Shadow DOM 환경에서도 갤러리 내부 휠 스크롤 정상 동작.
- 페이지(트위터) 스크롤 차단 정책은 유지(외부에서만 소비).
- 이벤트 리스너 누수 0, dev/prod 빌드 GREEN.

  4.2/4.6 가드 지속 검증).
  - smoke: 실제 휠 조작 시 갤러리 내부에서 스크롤이 자연스럽게 동작하고,
    페이지(트위터 타임라인)는 스크롤되지 않음.

  수용 기준:
  - 갤러리 내부 휠 스크롤 정상 동작(연속/가속/스크롤바 포함), 페이지 스크롤은
    차단.
  - 초기 컨테이너 미준비 구간에서의 동작은 회귀 없음(필요 시 터치 없음, PC 전용
    유지).
  - 이벤트 리스너 누수/중복 없음, 정책/테스트 스위트 GREEN.
