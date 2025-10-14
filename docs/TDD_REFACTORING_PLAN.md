# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-15 **상태**: Phase 69 진행 준비 🔶

## 프로젝트 스냅샷

- **빌드**: dev 839 KB / prod **316.99 KB** ✅ (번들 예산 8.01 KB 여유)
- **테스트**: **768 passing** (764 base + 4 Phase 68.1), 1 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (**257 modules**, **712 dependencies**) ✅
- **번들 예산**: **316.99 KB / 325 KB** (2.5% 여유) ✅

## 디자인 토큰 현황 (2025-10-15)

- **총 토큰**: 89개 (Phase 67 완료, 27.6% 감소)
- **중복 정의**: 20개 (cross-scope override, 정책 준수)
- **미사용 토큰**: 0개 ✅
- **저사용 토큰**: 53개 (컴포넌트 응집·접근성 사유 유지)

---

## 활성 계획

### Phase 69: 프로덕션 로그 기반 렌더링 최적화 (2025-10-15) 🔶

**분석 근거**: `x.com-1760437874632.log` (Dev userscript) + `AGENTS.md`,
`docs/ARCHITECTURE.md`, `docs/CODING_GUIDELINES.md`의 정책.

#### 핵심 관찰 요약

| ID  | 로그 스냅샷                                                                             | 영향                            | 근본 원인 가설                                            |
| --- | --------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------- |
| L-1 | `[GalleryRenderer] 최초 렌더링 시작` 메시지가 10:31:05.501Z와 10:31:05.512Z에 연속 발생 | 초기 렌더링 중복, DOM 재구성    | 갤러리 마운트 effect가 두 번 실행, guard 부재             |
| L-2 | `useGalleryFocusTracker` manual/auto focus 사이클이 100ms 간격으로 반복                 | CPU 스파이크, 200+ line 로그    | IntersectionObserver와 effect 간 순환, manual 상태 재설정 |
| L-3 | 동일 delta 값 wheel 이벤트가 1ms 간격으로 두 번 처리                                    | 스크롤 과부하, UX 저하          | 이벤트 리스너 중복 또는 디바운스 부재                     |
| L-4 | `System theme detection initialized` / `ThemeService initialized` 각 2회 기록           | 서비스 중복 초기화, 리소스 낭비 | ThemeService 싱글톤 가드 부재                             |
| L-5 | `viewport:resize:*` ID가 다른 값으로 두 번 등록                                         | cleanup 부담, 불필요한 재처리   | 초기화 분기 간 이벤트 중복 등록                           |

#### 솔루션 후보 비교

| 옵션 | 개요                               | 장점                       | 단점                      | 채택 |
| ---- | ---------------------------------- | -------------------------- | ------------------------- | ---- |
| A    | Effect 배칭/디바운싱으로 증상 완화 | 구현 용이, 빠른 완화       | 근본 원인 남음, 지연 도입 | 보조 |
| B    | 렌더링·서비스 구조 재설계          | 장기적 해결, 유지보수 향상 | 범위 큼, 회귀 위험        | 추후 |
| C    | 증분 개선 (Phase 69.1~69.4)        | 단계별 검증, 위험 분산     | 총 소요 증가              | ✅   |

---

#### Phase 69.1: useGalleryFocusTracker 로직 단순화 🎯

- **목표**: 동일 인덱스 반복 focus 사이클 제거, CPU 추가 60% 감소
- **TDD 계획**
  1. RED: `test/unit/hooks/use-gallery-focus-tracker-events.test.ts`
     - 동일 인덱스 연속 navigation 시 autoFocus 1회만 발생
     - manual focus cleared/applied 호출이 1 tick 내 중복 발생하지 않음
     - IntersectionObserver 콜백이 requestAnimationFrame 배칭되는지 검증
  2. GREEN: `useGalleryFocusTracker.ts`
     - `createEffect`에 `on([isEnabled, container])` 적용, 타 signal 추적 방지
     - manual/auto focus 상태 통합, 중복 호출 guard 추가
     - IntersectionObserver 콜백을 RAF 디바운스로 감싸기
  3. REFACTOR: 로깅 레벨 정리, mock Observer helper 도입
- **성공 지표**: observer 초기화 로그 80% 감소, CPU 프로파일에서 hook 실행 40%
  이하
- **예상 번들 영향**: +0.5 KB | **예상 시간**: 3~4h

#### Phase 69.2: GalleryRenderer 중복 렌더링 가드 🎯

- **목표**: 최초 렌더링을 단 1회로 제한, DOM 재생성 제거
- **TDD 계획**
  1. RED: `test/unit/features/gallery/gallery-renderer-lifecycle.test.ts`
     - 마운트 시 렌더 함수 호출이 1회인지 spy로 검증
     - signal 업데이트 후 재마운트 없이 반응형 업데이트만 발생
  2. GREEN: `GalleryRenderer.tsx`
     - `onMount` + guard flag 혹은 memo로 중복 초기화 차단
     - 초기 로그 메시지 1회로 축약
  3. REFACTOR: effect/cleanup 구조 정리
- **성공 지표**: 렌더 로그 1회, DevTools 초기 commit 50% 감소
- **예상 번들 영향**: +0.3 KB | **예상 시간**: 2~3h

#### Phase 69.3: 이벤트 핸들러 중복 방지 🔶

- **목표**: wheel/resize/keydown 핸들러 중복 등록 제거, 스크롤 처리량 40~50%
  감소
- **TDD 계획**
  1. RED: `test/unit/features/gallery/use-gallery-scroll.test.ts`
     - 동일 이벤트 1 tick 내 다중 등록 차단 검증
     - wheel 이벤트가 RAF 디바운스로 1회만 처리되는지 확인
  2. GREEN: `useGalleryScroll.ts`, `EventManager.ts`
     - 이벤트 등록 시 key 기반 dedupe map 도입
     - wheel handler를 RAF 디바운스로 감싸고 cleanup 강화
  3. REFACTOR: 로깅 축소, 이벤트 추적 util 공유
- **성공 지표**: 로그에서 동일 delta 연속 기록 제거, 스크롤 체감 개선
- **예상 번들 영향**: +0.4 KB | **예상 시간**: 2~3h

#### Phase 69.4: ThemeService 중복 초기화 방지 🔶

- **목표**: ThemeService/자동 테마 감지 초기화를 세션당 1회로 제한
- **TDD 계획**
  1. RED: `test/unit/shared/services/theme-service-lifecycle.test.ts`
     - 동일 세션 재호출 시 초기화가 다시 발생하지 않는지 확인
     - 갤러리 재오픈 시 기존 인스턴스 재사용 검증
  2. GREEN: `ThemeService.ts`, `initializeTheme.ts`
     - lazy singleton (`getThemeServiceInstance`) 가드 추가
     - CoreService 등록 시 이미 존재하면 재사용
  3. REFACTOR: 중복 로그 메시지 제거, 서비스 수명주기 문서화
- **성공 지표**: 로그에서 ThemeService 초기화 메시지 1회, 초기 진입 시간 5~10ms
  감소
- **예상 번들 영향**: +0.2 KB | **예상 시간**: 1~2h

#### Phase 69 완료 조건

- 모든 하위 Phase 테스트 GREEN, `npm run validate` 및 `npm run build` 통과
- 프로덕션 번들 ≤ 325 KB 유지, 디자인 토큰 정책 위배 없음
- `npm run maintenance:check` 결과 이상 없음
- Phase 69 이전/이후 로그 비교 시 L-1~L-5 패턴 재발 금지
- Chrome DevTools Performance/Memory 프로파일에서 CPU·스크롤 지표 개선 확인

---

## 백로그 (모니터링)

1. **번들 크기 경계**: prod 번들이 322 KB(예산 99%) 접근 시 Phase 67 Step 4-5
   재개
2. **StaticVendorManager 자동 초기화 경고**: Phase 70에서 bootstrap 순서 개선
   예정
3. **순환 네비 UX 개선**: 경계 경고 로그 재분석 필요 시 Phase 71 후보

---

## 설계 원칙 (요약)

1. 유지보수성 우선 — 번들 크기보다 디자인 일관성
2. 컴포넌트 응집도 — 1회 사용 토큰도 컴포넌트 책임이면 유지
3. 과도 추상화 지양 — 재사용 없는 추상화 제거
4. 접근성 우선 — WCAG 기준 준수 토큰/행동 유지
5. TDD 기본 — RED → GREEN → REFACTOR 순서 준수
6. ROI 검토 — 시간 대비 가치 평가 후 진행

---

## 참고 문서

- `AGENTS.md`: 개발 워크플로, 스크립트 규칙
- `docs/ARCHITECTURE.md`: 3계층 구조와 의존성 경계
- `docs/CODING_GUIDELINES.md`: 디자인 토큰·PC 이벤트·Vendor getter 규칙
- `docs/TDD_REFACTORING_PLAN_COMPLETED.md`: 완료 Phase 상세 기록
- `docs/MAINTENANCE.md`: 유지보수 점검 절차
- `docs/TDD_REFACTORING_PLAN_Phase63.md`: Phase 63 아카이브
