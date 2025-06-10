# 🤝 기여 가이드라인

X.com Enhanced Gallery 프로젝트에 기여해 주셔서 감사합니다! 이 가이드를 통해 효과적으로 기여할 수 있습니다.

## 🚀 빠른 시작

### 전제 조건

- **Node.js** ≥20.0.0
- **npm** ≥8.0.0
- **Git** ≥2.30.0

### 개발 환경 설정

1. **저장소 포크 및 클론**

   ```bash
   git clone https://github.com/your-username/xcom-enhanced-gallery.git
   cd xcom-enhanced-gallery
   ```

2. **의존성 설치**

   ```bash
   npm install
   ```

3. **개발 서버 시작**

   ```bash
   npm run dev
   ```

4. **품질 검사 실행**
   ```bash
   npm run quality
   ```

## 🔄 개발 워크플로우

### 1. 이슈 및 작업 계획

- 🔍 **이슈 확인**: [기존 이슈](../issues) 검토
- 📝 **새 이슈 생성**: 해당하는 [이슈 템플릿](./ISSUE_TEMPLATE/) 사용
- 🏷️ **라벨 할당**: 자동 라벨링 시스템 활용

### 2. 브랜치 전략

```bash
# Feature 개발
git checkout -b feature/gallery-enhancement

# 버그 수정
git checkout -b fix/media-download-error

# 문서 개선
git checkout -b docs/api-documentation
```

**브랜치 명명 규칙**:

- `feature/` - 새로운 기능
- `fix/` - 버그 수정
- `docs/` - 문서 작업
- `refactor/` - 리팩토링
- `test/` - 테스트 개선

### 3. 개발 및 테스트

#### 코드 품질 확인

```bash
npm run quality      # 전체 품질 검사
npm run lint         # ESLint 검사
npm run typecheck    # TypeScript 타입 검사
npm run test         # 테스트 실행
npm run format       # 코드 포맷팅
```

#### 빌드 테스트

```bash
npm run build:dev    # 개발 빌드
npm run build        # 프로덕션 빌드
```

### 4. 커밋 및 PR

#### 커밋 메시지 규칙

[Conventional Commits](https://www.conventionalcommits.org/) 스타일 준수:

```bash
feat: 갤러리 키보드 네비게이션 추가
fix: 동영상 다운로드 오류 수정
docs: API 문서 업데이트
style: 코드 포맷팅 개선
refactor: 미디어 추출 로직 리팩토링
test: 갤러리 컴포넌트 테스트 추가
chore: 빌드 스크립트 개선
```

#### Pull Request 생성

1. **PR 템플릿 사용**: 적절한 [PR 템플릿](./PULL_REQUEST_TEMPLATE/) 선택
2. **이슈 연결**: `Closes #123` 형태로 관련 이슈 연결
3. **체크리스트 완료**: PR 템플릿의 모든 항목 확인
4. **리뷰어 할당**: 자동 할당 또는 수동 지정

## 🔧 개발 가이드라인

### 코딩 스타일

프로젝트는 [코딩 가이드라인](../docs/CODING_GUIDELINES.md)을 따릅니다:

- **TypeScript Strict 모드** 사용
- **Preact 함수형 컴포넌트** 스타일
- **CSS Modules** 또는 **인라인 스타일**
- **의존성 규칙** 준수: `features → shared → core → infrastructure`

### 아키텍처 원칙

```
src/
├── features/          # 기능별 모듈
│   ├── gallery/      # 갤러리 UI 및 상태
│   ├── media/        # 미디어 추출 및 처리
│   └── settings/     # 설정 관리
├── shared/           # 재사용 가능한 컴포넌트
├── core/            # 핵심 비즈니스 로직
└── infrastructure/  # 외부 의존성
```

### 외부 라이브러리 사용

⚠️ **중요**: 외부 라이브러리는 `src/shared/utils/vendors/` 경유만 허용

```typescript
// ✅ 올바른 사용
import { getFflate, getPreact } from '@shared/utils/vendors';

// ❌ 금지된 사용
import { deflate } from 'fflate';
```

## 🧪 테스트 가이드라인

### 테스트 작성

```bash
# 테스트 파일 위치
test/
├── unit/              # 유닛 테스트
├── integration/       # 통합 테스트
└── e2e/              # E2E 테스트 (MCP)
```

### 테스트 실행

```bash
npm run test           # 전체 테스트
npm run test:watch     # 감시 모드
npm run test:coverage  # 커버리지 포함
```

### 커버리지 목표

- **라인 커버리지**: 최소 80%
- **브랜치 커버리지**: 최소 75%
- **함수 커버리지**: 최소 85%

## 🔄 CI/CD 파이프라인

모든 PR은 자동화된 검증을 통과해야 합니다:

### 자동 검사 항목

1. **CI Pipeline**

   - TypeScript 타입 검사
   - ESLint 코딩 규칙
   - Prettier 포맷 검사
   - 유닛 테스트 + 커버리지
   - 의존성 구조 검증

2. **Build Test**

   - Development 빌드
   - Production 빌드
   - 빌드 검증 스크립트

3. **Code Quality**
   - 의존성 분석
   - 번들 크기 검사
   - 보안 취약점 검사

### 브랜치 보호 규칙

- **main 브랜치**: 모든 검사 통과 + 1명 이상 승인 필요
- **develop 브랜치**: CI 검사 통과 필요

자세한 내용은 [워크플로우 가이드](../docs/WORKFLOWS.md)를 참고하세요.

## 📝 문서화 가이드라인

### JSDoc 주석

````typescript
/**
 * 트위터 미디어 URL에서 원본 화질 URL을 추출합니다.
 *
 * @param url - 처리할 미디어 URL
 * @param format - 원하는 포맷 ('jpg', 'png', 'webp')
 * @returns 원본 화질 URL
 *
 * @example
 * ```typescript
 * const originalUrl = getOriginalMediaUrl(
 *   'https://pbs.twimg.com/media/example.jpg:small',
 *   'jpg'
 * );
 * ```
 */
````

### 문서 업데이트 필요 시

- **기능 추가/변경**: 해당 문서 섹션 업데이트
- **API 변경**: `docs/` 디렉토리 문서 수정
- **설정 변경**: README.md 설치/사용법 업데이트

## 🌍 브라우저 호환성

### 지원 브라우저

- **Chrome/Edge**: 90+ (ES2020 지원)
- **Firefox**: 90+ (ES2020 지원)
- **Safari**: 14+ (ES2020 지원)

### 호환성 고려사항

- **모던 JavaScript**: ES2020+ 기능 사용 가능
- **Web APIs**: 지원되지 않는 API는 폴백 구현
- **유저스크립트 매니저**: Tampermonkey, Greasemonkey 지원

## 🎯 X.com 인터페이스 대응

### 선택자 전략

```typescript
// ✅ 강력한 선택자 (여러 옵션)
const selectors = [
  '[data-testid="videoComponent"]',
  '[aria-label*="video"]',
  '.css-18t94o4', // 폴백 선택자
];

// ❌ 취약한 선택자
const selector = '.css-18t94o4'; // 클래스명은 자주 변경됨
```

### 인터페이스 변경 감지

- **변경 모니터링**: DOM 구조 변화 감지
- **오류 리포팅**: 자동 오류 수집 시스템
- **사용자 피드백**: 이슈 템플릿을 통한 신고

## 🚀 릴리스 프로세스

### 버전 관리

프로젝트는 [Semantic Versioning](https://semver.org/)을 따릅니다:

- **MAJOR**: 호환성이 깨지는 변경
- **MINOR**: 새로운 기능 추가
- **PATCH**: 버그 수정

### 자동 릴리스

```bash
# package.json 버전 업데이트 후 자동 릴리스
npm version patch|minor|major
git push

# 수동 릴리스 트리거
gh workflow run auto-release.yml -f version_type=minor
```

## 🤖 AI 코딩 어시스턴트 사용

본 프로젝트는 **GitHub Copilot**과 함께 개발되었습니다:

### AI 활용 가이드라인

- **코드 생성**: 기본 구조 및 보일러플레이트
- **리팩토링**: 코드 개선 및 최적화
- **테스트 작성**: 테스트 케이스 생성
- **문서화**: JSDoc 및 README 작성

### 인간 검토 필수

- **모든 AI 생성 코드**는 인간이 검토
- **비즈니스 로직**은 수동으로 검증
- **보안 관련 코드**는 특별한 주의

## 🙋‍♂️ 도움이 필요하신가요?

### 커뮤니티 지원

- **GitHub Issues**: 버그 신고 및 기능 요청
- **GitHub Discussions**: 일반적인 질문 및 토론
- **Pull Request**: 코드 리뷰 및 피드백

### 문서 리소스

- **[코딩 가이드라인](../docs/CODING_GUIDELINES.md)**: 상세한 개발 규칙
- **[워크플로우 가이드](../docs/WORKFLOWS.md)**: CI/CD 파이프라인
- **[기술 스택](../docs/TECH_STACK.md)**: 사용 기술 및 아키텍처
- **[배포 체크리스트](../docs/DEPLOYMENT_CHECKLIST.md)**: 배포 전 확인사항

### 기여 인정

모든 기여자는 프로젝트 [README.md](../../README.md)에 기록됩니다.

---

**🎉 기여해 주셔서 감사합니다!**

여러분의 기여로 X.com Enhanced Gallery가 더욱 발전할 수 있습니다.
