# TDD 리팩토링 활성 계획 (경량)

본 문서는 진행 중인 활성 Phase만 유지합니다. 완료된 항목은
`TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시 이관합니다.

업데이트: 2025-09-13 — 활성 Phase: UI-ALIGN(툴바/설정 정렬) · ICN-H0(H4–H5)

## 운영 원칙(불변)

- TypeScript strict 100%, 공개 API 명시적 반환 타입
- 외부 의존성은 전용 getter 경유(preact/signals/fflate/GM\_\*) — 직접 import
  금지
- PC 전용 입력만 사용(click/keydown/wheel/contextmenu)
- 디자인/모션/spacing/z-index 모두 토큰 기반만 사용(raw 숫자/hex/ms 금지)
- Result status 모델: 'success' | 'partial' | 'error' | 'cancelled'

## 활성 Phase

### UI-ALIGN — 툴바/설정 모달 정렬/배치 하드닝(New)

목표

- 툴바와 설정 모달의 텍스트/아이콘의 수직 정렬(baseline/center), 버튼 패딩과
  간격(gap), 클릭 영역 크기를 토큰 기반으로 표준화합니다.
- IconButton 크기 스케일(sm/md/lg/toolbar)과 라벨 타이포그래피(line-height,
  letter-spacing)를 명시하여 시각적 리듬을 통일합니다.
- PC 전용 입력/접근성(focus-visible, aria-label) 규칙을 유지하면서 시각적
  일관성만 개선합니다(기능 변화 없음).

대안 검토(장단점)

- A) 전역 CSS 보강(modern-features.css에 오버라이드)
  - 장점: 적용이 빠름, 영향 범위가 넓어 일괄 조정 가능
  - 단점: 전역 사이드이펙트 위험, 컴포넌트 캡슐화 약화 → 테스트 회귀 위험
- B) 컴포넌트 CSS Modules 정비(권장, 선정)
  - 장점: 변경 범위가 명확, 테스트/스냅샷에 친화적, 토큰 규칙 준수 용이
  - 단점: 파일 다수 수정 필요, 스타일 중복 시 정리 시간이 필요
- C) 공용 유틸 클래스 추가(.xeg-flex-center, .xeg-row-align 등)
  - 장점: 재사용 용이, 중복 감소
  - 단점: CSS Modules와 중첩 사용 시 복잡도 증가, 네이밍/레이어 관리 비용
- D) IconButton 크기 스케일 확장(컴포넌트 수준 리팩터)
  - 장점: 소비처 수정 없이 일관성 향상
  - 단점: 영향 범위 큼 — 단계적 적용 필요, 회귀 테스트 보강 요구

선정된 접근(B 중심, 필요 시 C 최소 도입)

- Toolbar.module.css, ToolbarButton.module.css, SettingsModal.module.css를
  중심으로 CSS Modules에서 토큰 기반 패딩/갭/정렬을 정비합니다.
- IconButton은 현행 스케일을 유지하되, 툴바/모달 헤더 맥락에서 line-height와
  수직 정렬 규칙을 모듈에 명시합니다.
- 유틸 클래스는 필요한 1–2개만 도입(예: 시각적 중앙 정렬)하고, 네이밍
  충돌/레이어를 피합니다.

단계별 TDD 계획(RED → GREEN → REFACTOR)

1. ALIGN-1 — 툴바 타이포그래피/아이콘 수직 정렬
   - RED: 툴바 버튼/라벨의 line-height 및 IconButton 크기 스냅샷, focus-visible
     토큰 가드
   - GREEN: Toolbar.module.css에서 버튼 높이/패딩을 `var(--xeg-space-*)`로
     통일하고, 아이콘과 텍스트가 수직 가운데 정렬되도록 정비
   - REFACTOR: 중복된 margin 보정 제거, 전역 오버라이드 의존성 축소

2. ALIGN-2 — 툴바 패딩/간격 스케일 표준화
   - RED: .toolbar 컨테이너 padding/gap이 스페이싱 토큰만 사용하는지 스캔, 클릭
     타겟 최소 크기(>= 36px 또는 md 스케일) 가드
   - GREEN: ToolbarButton.module.css의 내부 패딩/갭을 토큰화하고 hover/active
     스타일을 프리셋으로 일치
   - REFACTOR: deprecated 전역 스타일 경고 주석 제거 및 모듈로 이관

3. ALIGN-3 — 설정 모달 헤더/닫기 버튼 정렬
   - RED: SettingsModal 헤더 타이틀↔닫기 IconButton 수직/수평 정렬 스냅샷, 버튼
     크기=2.5em 및 radius 토큰 가드
   - GREEN: SettingsModal.module.css에서 헤더 레이아웃을 flex/grid로 명시, 닫기
     버튼 intent 중립/포커스 링 토큰 적용 확인
   - REFACTOR: 임시 margin 보정 제거, aria-label 일관성 확인

4. ALIGN-4 — 설정 폼 행 배치/간격 정합
   - RED: 라벨/컨트롤 baseline 정렬 및 행 간격 스케일 테스트, 고대비/감속 모션
     분기 스냅샷
   - GREEN: 라벨 타이포그래피(line-height)와 컨트롤 높이 스케일을 맞추고
     gap/padding을 스페이싱 토큰으로 통일
   - REFACTOR: 중복 유틸 클래스 병합 또는 제거

수용 기준(AC)

- 툴바와 설정 모달의 텍스트/아이콘이 시각적으로 어긋남 없이 정렬되고,
  padding/gap이 토큰 기반으로 통일
- IconButton 크기/포커스 링/라운딩이 규칙(CODING_GUIDELINES)과 일치, PC 전용
  입력만 사용
- 관련 스냅샷/스캔 테스트 GREEN, 번들/산출물/소스맵 가드 기존대로 PASS

리스크/롤백

- 전역 스타일과의 충돌 가능 → 컴포넌트 모듈 우선 적용, 전역 오버라이드는 최소화
- 클릭 타겟 크기 변경에 따른 사용감 변화 → 스냅샷 + 상호작용 테스트로 검증 후
  점진 반영

### ICN-H0 — Heroicons 전면 이행(Epic)

목표

- 내부 Tabler 스타일 아이콘 구현을 Heroicons(Outline/Solid) 기반으로 전면 대체
- 프로젝트 규칙(벤더 getter, 디자인 토큰, PC 전용 입력, TDD) 준수 하에 안전하게
  점진 이행

아키텍처 결정(선정된 솔루션)

- 외부 패키지 직접 import 금지 규칙을 지키기 위해 전용 벤더 getter를 신설합니다.
  - 경로: `src/shared/external/vendors/heroicons-react.ts`
  - 방식: 필요한 개별 아이콘만 `@heroicons/react/24/(outline|solid)`에서 import
    → 객체로 노출
- 시각/접근성 일관성을 위해 내부 `Icon` 래퍼 규격을 유지하되, Heroicons
  컴포넌트를 감싸는 얇은 어댑터를 둡니다.
  - 경로 예: `src/shared/components/ui/Icon/hero/*`
  - 역할: 크기/색/두께를 디자인 토큰(`--xeg-icon-*`)으로 주입, aria 규칙 유지
- 아이콘 로딩은 기존 `iconRegistry`의 동적 import 경로를 유지하여 코드
  스플리팅과 캐시를 확보합니다.
- Preact/compat는 현행 설정을 사용(Vite preset), 신규 의존성은 전부 벤더 getter
  경유 참조
- 라이선스 파일을 `LICENSES/heroicons-MIT.txt`로 추가(배포물 검증 경로 일치)

대안 검토(장단점 비교 요약)

- A) 직접 사용: 컴포넌트에서 `@heroicons/react` 바로 import
  - 장점: 작업량 최소
  - 단점: 레포 규칙 위반(벤더 getter 금지), 테스트/모킹 어려움, 스캔 테스트 RED
    예상 → 불가
- B) 벤더 getter만 추가, 기존 Icon 래퍼 미사용
  - 장점: 간단
  - 단점: 디자인 토큰/접근성 규칙을 아이콘 소비처마다 중복 구현 위험, 스타일
    일관성 저하
- C) 벤더 getter + 어댑터 + iconRegistry 전환(선정)
  - 장점: 규칙 준수, 스타일·접근성·로딩(코드 스플리팅) 일관 유지, 점진 이행/롤백
    용이
  - 단점: 소규모 어댑터/테스트 작성 비용
- D) SVG 인라인 재작성
  - 장점: 외부 의존성 제거
  - 단점: 유지보수·업데이트 비용 높음, 전면 이행 목적과 불일치(아이콘 수가 많음)

진행 상황: H1–H3, H6 완료 → 완료 로그 문서 참고. 남은 활성 단계 H4–H5만
유지합니다.

단계별 TDD 계획(RED → GREEN → REFACTOR)

4. H4 — 실제 소비 지점 이행(툴바/설정/도움말 등 대표 UI)

- RED: 툴바/모달 버튼 아이콘 스냅샷 및 크기 토큰 가드, 포커스/hover 회귀 테스트
- GREEN: `IconButton` 소비부에서 Heroicons 어댑터 사용으로 교체(동일 aria-label
  유지)
- REFACTOR: 사용처 공통화/중복 제거, 스타일 잔재 삭제

5. H5 — 제거/정리

- RED: 레거시 아이콘 파일 존재/배럴 노출 스캔 테스트(존재 시 실패)
- GREEN: 사용 종료된 Tabler 스타일 아이콘 컴포넌트/배럴 제거, dead import 정리
- REFACTOR: 문서/주석 최신화

수용 기준(AC)

- 모든 아이콘 소비 경로가 Heroicons 기반으로 렌더되고, UI/접근성/토큰 테스트가
  GREEN
- 외부 패키지는 벤더 getter를 통해서만 접근(정적 스캐너/테스트로 가드)
- 번들/산출물 검증 PASS, dev/prod 소스맵/데드코드 가드 유지
- 레거시(Tabler) 아이콘 구현/노출 제거, 문서에 이행 사실 명시

리스크/롤백 전략

- 시각 변경 리스크: 동일 이름으로 어댑터 경유 교체(스냅샷 테스트로 차이 감지);
  필요 시 outline/solid 선택 분기로 조정
- 번들 팽창 리스크: 개별 import만 허용, 동적 로딩 유지, 번들 사이즈 스냅샷 비교
  후 필요 시 일부 아이콘만 유지 교체
- 호환성 리스크: Preact/compat 하에서 Heroicons 컴포넌트 계약 최소(함수형 SVG),
  문제 시 해당 아이콘만 인라인 SVG 폴백 허용

예상 산출물(코드 변경 안내)

- `src/shared/external/vendors/heroicons-react.ts`(신규)
- `src/shared/components/ui/Icon/hero/*` 어댑터(점진 추가)
- `src/shared/services/iconRegistry.ts` 매핑 전환
- `LICENSES/heroicons-MIT.txt` 추가

## TDD 규칙과 브랜치

1. RED → GREEN → REFACTOR 순으로 커밋을 구성합니다.
2. 병합 전 필수 게이트: 타입/린트/전체 테스트/빌드/사이즈 가드 PASS.
3. 완료 시: 계획 문서에서 제거하고 완료 로그에 1줄 요약 추가.

## 참고 링크

- 완료 로그: docs/TDD_REFACTORING_PLAN_COMPLETED.md
- 백로그: docs/TDD_REFACTORING_BACKLOG.md
- 코딩 규칙: docs/CODING_GUIDELINES.md
