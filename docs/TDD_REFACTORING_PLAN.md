# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-27 — 현재 활성 Epic 없음. 최근 완료 내역은
`docs/TDD_REFACTORING_PLAN_COMPLETED.md`를 참조하세요.

---

## 1. 운영 원칙(요약/링크)

- 코딩/스타일/입력/벤더 접근/테스트 등의 일반 규칙은
  `docs/CODING_GUIDELINES.md`와 `docs/vendors-safe-api.md`를 단일 소스로
  사용합니다.
- 실행/CI/빌드 파이프라인과 스크립트는 루트 `AGENTS.md`를 참조합니다.
  - 본 문서는 “활성 Epic/작업”과 해당 Acceptance에만 집중합니다.

---

## 2. 활성 Epic 현황

### EPIC — GALLERY-WARNING-HARDENING (신규)

| 구분              | 내용                                                                                                                                                                                                                                                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Problem Statement | 갤러리 실행 시 콘솔에 다량의 경고가 누적되어 실제 문제 징후를 식별하기 어렵고, 일부는 기능상 결함으로 이어집니다.                                                                                                                                                                                                                                              |
| 주요 증상         | (1) `SettingsService`가 `gallery.windowingEnabled`/`gallery.windowSize` 기본값을 찾지 못해 반복 경고, (2) `EventManager` 인스턴스를 정리한 뒤 재등록을 시도하면 `isDestroyed` 상태가 유지되어 이벤트 바인딩이 무력화되고 경고가 폭주, (3) `Icon` 컴포넌트가 SVG `width`/`height` 속성에 CSS 변수를 직접 주입해 브라우저가 `Expected length` 오류를 출력합니다. |
| 영향              | 로그 노이즈 증가, 갤러리 스크롤 이벤트 누락으로 사용자 입력 무시 가능성, 브라우저 에러로 디버깅 난이도 상승.                                                                                                                                                                                                                                                   |
| 목표              | 경고/에러 0화 및 재발 방지를 위한 테스트/가드 마련.                                                                                                                                                                                                                                                                                                            |

#### 솔루션 옵션 평가 요약

1. **Settings 기본값 경고**
   - A안: `DEFAULT_SETTINGS.gallery`에 `windowingEnabled`/`windowSize`를
     추가하고 타입/마이그레이션 가드를 보강 (선택 ✅).
     - Pros: 경고 제거, 신설 기능의 기본 UX 통일, `migrateSettings`가 자동으로
       과거 데이터 보강.
     - Cons: 설정 검증 규칙/테스트 업데이트 필요.
   - B안: `SettingsService.get`에서 누락 경고를 억제 (미채택). 경고 음소거는
     다른 회귀를 숨길 위험이 큼.

2. **EventManager 재사용 경고**
   - A안: `useGalleryScroll`이 effect마다 새 `EventManager`를 생성하고 cleanup
     후 ref를 비워 재등록 시 경고 없이 새 인스턴스를 사용 (선택 ✅).
     - Pros: 스코프가 훅 내부로 한정되어 변경 범위가 작고, 경고/리스너 누락 동시
       해결.
     - Cons: Effect 재실행이 잦은 시나리오에서 인스턴스 생성이 반복되므로 비용
       모니터링 필요.
   - B안: `EventManager`에 `reset()`을 추가해 내부 `DOMEventManager`를 재구성
     (보류). 글로벌 싱글톤 경계를 가진 다른 사용처에 영향이 불명확.

3. **Icon SVG 속성 오류**
   - A안: 숫자 크기는 `width`/`height` 속성으로 유지하되, 문자열(CSS 변수/단위
     포함)인 경우 `style.width/height`로 이동하고 기존 style과 병합 (선택 ✅).
     - Pros: 콘솔 오류 제거, 디자인 토큰 사용 패턴 유지.
     - Cons: `style` 머지 로직을 위한 유닛 테스트 추가 필요.
   - B안: 전역 CSS 클래스에서만 크기를 제어하고 속성은 제거 (미채택). 컴포넌트
     단독 사용 시 제약이 커짐.

StaticVendorManager 초기화 경고는 자동 복구 후 정상 동작을 확인했으므로, 본
Epic에서는 모니터링 대상으로만 기록합니다.

#### Acceptance (GREEN 기준)

- 로그 리플레이 시 위 세 종류의 경고/에러가 모두 사라진다.
- `SettingsService.get('gallery.windowingEnabled')`와 `windowSize`가 기본값을
  반환하며 저장소에 누락된 경우에도 경고 없이 마이그레이션된다.
- `useGalleryScroll` 재마운트/리렌더 루프에서도 휠 이벤트가 정상 처리되고 리스너
  누락 경고가 발생하지 않는다.
- `Icon` 컴포넌트가 CSS 변수를 사용할 때 `width`/`height` 속성에 invalid
  length가 출력되지 않는다.
- 타입/린트/테스트/빌드 품질 게이트 통과.

#### TDD / 단계별 액션 (RED → GREEN)

1. **RED**: Settings 기본값/검증/마이그레이션 테스트 추가 (`SettingsService`
   단위 테스트 확장, windowing 시나리오 스텁 포함).
2. **RED**: `useGalleryScroll` 이벤트 재바인딩 회귀 테스트 추가 (JSDOM 기반으로
   cleanup 후 재등록 동작 검증, 경고 스파이).
3. **RED**: `Icon` 컴포넌트 차원 테스트 추가 (CSS 변수 사이즈 입력 시 DOM
   attribute snapshot 검증).
4. **GREEN**: 각 모듈 구현 → 경고 제거 및 기능 회복.
5. **REFACTOR**: 관련 문서/스토리북/샘플 업데이트, 필요 시 로깅 레벨 조정.

#### 리스크 & 메모

- Settings schema 변경은 저장된 사용자 데이터와의 호환성이 핵심 →
  `migrateSettings` 경로를 집중 검증.
- EventManager 재구성이 타 훅에서 재사용될 가능성을 고려하여 스코프를 명확히
  하고, 필요 시 공통 유틸로 승격.
- Icon 스타일 병합 시 `style` prop 타입 캐스팅에 주의 (Preact typings 준수).
- StaticVendorManager 경고는 Epic 종료 후에도 1회 발생 여부를 모니터링; 필요 시
  별도 TASK 전환.

## 3. 다음 사이클 준비 메모(Placeholder)

- 신규 Epic 제안은 백로그에 초안 등록 후 합의되면 본 문서의 활성 Epic으로
  승격합니다.

---

## 5. TDD 워크플로 (Reminder)

1. RED: 실패 테스트(또는 TODO) 추가 — 최소 명세만 표현
2. GREEN: 가장 작은 변경으로 통과 (과도한 범위 확대 금지)
3. REFACTOR: 중복 제거 / 구조 개선 (동일 테스트 GREEN 유지)
4. Rename: `.red.` 파일명 제거 → 가드 전환
5. 이동: 완료 항목 본 문서에서 제거 & Completed 로그에 1줄 요약

Gate 체크리스트(요지):

- 타입/린트/테스트/빌드 검증은 `AGENTS.md`와 `CODING_GUIDELINES.md`의 품질
  게이트를 따릅니다.

---

## 6. 참고 문서

| 문서                   | 위치                                     |
| ---------------------- | ---------------------------------------- |
| 완료 로그              | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그                 | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계                   | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙              | `docs/CODING_GUIDELINES.md`              |
| 계획 아카이브(축약 전) | `docs/archive/`                          |

필요 시 새 Epic 제안은 백로그에 초안(Problem/Outcome/Metrics) 형태로 먼저 추가
후 합의되면 본 문서 Epic 템플릿 섹션에 승격합니다.

---

## 7. 품질 게이트 및 검증 방법

모든 Epic/Task는 다음 게이트를 통과해야 합니다.

- 타입: `npm run typecheck` — strict 오류 0
- 린트/포맷: `npm run lint` / `npm run format` — 수정 사항 없거나 자동 수정 적용
- 테스트: `npm test` — 신규/갱신 테스트 GREEN, 리팩터링 임시 RED만 허용 주석
  필수
- 빌드: `npm run build:dev`/`prod` — 산출물 검증 스크립트 통과

추가로, 접근성 전용 스모크:

- Tab/Shift+Tab 네비게이션 스모크, Escape 복귀 스모크, aria-live 공지 스냅샷

메모리 전용 스모크:

- 타이머/리스너 카운트 0, revoke 큐 0, 대량 로딩 후 회복 확인(모킹)

---

## Change Notes (Active Session)

- 현재 공유할 활성 Change Note 없음.
