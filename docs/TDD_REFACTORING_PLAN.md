# TDD 리팩토링 활성 계획 (경량)

본 문서는 진행 중인 활성 Phase만 유지합니다. 완료된 항목은
`TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시 이관합니다.

업데이트: 2025-09-13 — 활성 Phase: ICN-H0(Heroicons 전면 이행)

## 운영 원칙(불변)

- TypeScript strict 100%, 공개 API 명시적 반환 타입
- 외부 의존성은 전용 getter 경유(preact/signals/fflate/GM\_\*) — 직접 import
  금지
- PC 전용 입력만 사용(click/keydown/wheel/contextmenu)
- 디자인/모션/spacing/z-index 모두 토큰 기반만 사용(raw 숫자/hex/ms 금지)
- Result status 모델: 'success' | 'partial' | 'error' | 'cancelled'

## 활성 Phase

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
