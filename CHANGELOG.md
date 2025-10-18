# Changelog

All notable changes to X.com Enhanced Gallery will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2025-10-18

### 🎉 프로젝트 안정화 마일스톤

이 릴리즈는 100+ Phase의 리팩토링 완료와 유지보수 모드 진입을 표시합니다.

### Changed

#### 인프라 개선

- Node.js 버전을 20에서 22로 업그레이드
- CI 매트릭스 조정 (Node 22/24 테스트)
- 빌드 검증 임계값 조정 (경고 기준: 332 KB)

#### 코드 품질 개선

- 타입 단언 31개 → 27개로 감소 (13% 개선)
  - Phase 100-102: 즉시 제거 7개, 검토 후 제거 2개
- 문서 간소화 (TDD_REFACTORING_PLAN.md 830줄 → 146줄, 82.4% 감소)
- accessibility-utils 모듈을 3개로 분해 (Phase 104)
- 큰 파일 재평가 및 아키텍처 경계 재확인

#### 문서화

- 개발 원칙 및 코드 품질 기준 추가
- Phase 완료 문서 지속적 업데이트
- 유지보수 모드 전환 문서화

### Fixed

- TypeScript strict 모드 0 errors 유지
- ESLint 0 warnings 유지
- CodeQL 5개 쿼리 모두 통과

### Performance

- 빌드 크기: 330.42 KB / 335 KB (98.6% 사용)
- 테스트 통과율: 99.1% (단위), 96.6% (E2E)
- 커버리지: 45% 기준선 설정

---

## [0.3.1] - 2025-06-11

### Changed

- Preact에서 Solid.js 1.9.9로 완전 마이그레이션
- 3계층 아키텍처 확립 (Features → Shared → External)
- Vendor getter 패턴 도입

### Added

- PC 전용 입력 이벤트 정책 수립
- 디자인 토큰 시스템 (OKLCH 색상 공간)
- TDD 기반 리팩토리링 워크플로

---

## [0.1.0] - 2025-06-11

### Added

- X.com 미디어 갤러리 뷰어
- 일괄 다운로드 기능
- 키보드 네비게이션 지원
- Preact 기반 UI

---

[0.4.0]: https://github.com/PiesP/xcom-enhanced-gallery/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/PiesP/xcom-enhanced-gallery/compare/v0.1.0...v0.3.1
[0.1.0]: https://github.com/PiesP/xcom-enhanced-gallery/releases/tag/v0.1.0
