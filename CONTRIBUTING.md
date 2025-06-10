# 기여 가이드라인

X.com Enhanced # 기여 가이드라인 프로젝트에 기여해주셔서 감사합니다. 아래는 기여를 위한 핵심 지침입니다.

## 개발 환경

- Node.js 18+, npm 9+, Git 필요
- 저장소 클론 및 의존성 설치 후 개발 서버 실행:
  ```bash
  git clone https://github.com/your-username/xcom-enhanced-gallery.git
  cd xcom-enhanced-gallery
  npm install
  npm run dev
  ```

## 브랜치/커밋/PR

- `feature/*`, `fix/*`, `docs/*` 브랜치에서 작업 후 `develop` 브랜치로 PR
- 커밋 메시지: `유형(범위): 제목` (예: `feat(viewer): 키보드 단축키 추가`)
- PR 제출 전 최신 develop 반영, 테스트/린트 통과, 변경 설명 필수

## 코드 스타일/품질

- ESLint, Prettier로 코드 스타일 자동화
- 커밋 전 `npm run lint`/`npm run format` 실행
- 타입 안전성, 접근성, 함수/파일 분리 등 [코드 품질 가이드](docs/CODE_QUALITY.md) 참고

## 테스트

- 새로운 기능/버그 수정 시 테스트 코드 작성
- `npm test`로 실행

## 문서화

- 새 문서 생성 대신 기존 문서에 추가/확장
- 코드 변경 시 관련 문서(README, USER_GUIDE 등)도 함께 업데이트

## 질문/이슈

- [GitHub 이슈](https://github.com/yourusername/xcom-enhanced-gallery/issues)로 문의
