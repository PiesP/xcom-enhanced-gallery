# 🤝 기여 가이드라인

X.com Enhanced Gallery 프로젝트에 기여해 주셔서 감사합니다!

## 🚀 빠른 시작

### 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/PiesP/xcom-enhanced-gallery.git
cd xcom-enhanced-gallery

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 품질 검사
npm run quality
```

## 🔄 개발 워크플로우

### 브랜치 전략

```bash
# Feature 개발
git checkout -b feature/기능명

# 버그 수정
git checkout -b fix/버그명

# 문서 개선
git checkout -b docs/문서명
```

### 커밋 메시지 규칙

[Conventional Commits](https://www.conventionalcommits.org/) 스타일:

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 업데이트
style: 코드 포맷팅
refactor: 리팩토링
test: 테스트 추가/수정
chore: 기타 작업
```

### 코드 품질

```bash
npm run validate    # 전체 검증 (typecheck + lint + format)
npm run lint:fix    # ESLint 검사 및 자동 수정
npm run typecheck   # TypeScript 검사 (tsgo 사용)
npm run test        # 테스트 실행
npm run format      # 코드 포맷팅
```

## 🔧 코딩 가이드라인

- **TypeScript Strict 모드** 사용
- **Solid.js 컴포넌트** 스타일 (Vendor getter 사용)
- **아키텍처 경계** 준수: `Features → Shared → External`
- **외부 라이브러리**는 `@shared/external/vendors` getter를 통해서만 접근
- **PC 전용 이벤트**만 사용 (터치/포인터 이벤트 금지)
- **CSS 디자인 토큰** 필수 (하드코딩 금지)

상세 규칙은 `docs/CODING_GUIDELINES.md` 참조

## 📝 Pull Request

1. 이슈 생성 또는 기존 이슈 확인
2. 브랜치 생성 및 개발
3. 품질 검사 통과 확인
4. PR 생성 및 리뷰 요청

더 자세한 내용은 프로젝트 문서를 참고하세요.
