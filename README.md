# 🚀 X.com Enhanced Gallery

> **AI 기반 개발 프로젝트** - GitHub Copilot과 함께 개발된 트위터(X) 미디어 뷰어 확장 프로그램

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)](https://typescriptlang.org/)
[![Preact](https://img.shields.io/badge/Preact-10.26.8-673AB8?logo=preact)](https://preactjs.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Userscript](https://img.shields.io/badge/Userscript-Ready-orange)](https://github.com/OpenUserJS/OpenUserJS.org/wiki/Userscript-Beginners-HOWTO)

X.com(트위터)에서 이미지와 동영상을 고품질로 다운로드하고 향상된 갤러리 뷰어를 제공하는 유저스크립트입니다.

## ✨ 주요 기능

### 🎞️ 향상된 미디어 뷰어

- **수직 스크롤 갤러리**: 트윗의 모든 미디어를 한번에 탐색
- **실시간 동영상 재생**: 썸네일에서 실제 동영상 추출 및 재생
- **반응형 디자인**: 모바일부터 데스크톱까지 최적화된 UI
- **이미지 확대/축소**: 다양한 피팅 모드 지원 (원본, 너비맞춤, 높이맞춤, 컨테이너맞춤)

### 💾 스마트 다운로드 시스템

- **단일/일괄 다운로드**: 개별 파일 또는 ZIP 압축 다운로드
- **고품질 원본 추출**: Twitter API를 통한 최고 품질 미디어 접근
- **동영상 다운로드**: 썸네일에서 실제 MP4 파일 추출
- **스마트 파일명**: 트윗 정보 기반 자동 파일명 생성

### 🎨 자동 테마 시스템

- **이미지 색상 분석**: 현재 보는 이미지에서 자동으로 테마 색상 추출
- **시간 기반 테마**: 낮/밤 시간에 따른 자동 테마 전환
- **접근성 준수**: 다크/라이트 모드 및 고대비 모드 지원

### ⌨️ 편리한 키보드 단축키

- `←/→`: 이전/다음 이미지 탐색
- `Home/End`: 첫 번째/마지막 이미지로 이동
- `Escape`: 갤러리 닫기
- `Space`: 동영상 재생/일시정지

## 📥 설치 방법

### 1. 유저스크립트 매니저 설치

먼저 브라우저에 유저스크립트 매니저를 설치하세요:

- **Chrome/Edge**: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: [Greasemonkey](https://addons.mozilla.org/firefox/addon/greasemonkey/) 또는 [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/)
- **Safari**: [Userscripts](https://apps.apple.com/app/userscripts/id1463298887)

### 2. 스크립트 설치

#### 방법 1: 직접 다운로드 (권장)

이 저장소의 `dist/xcom-enhanced-gallery.user.js` 파일을 클릭하여 설치하세요:

🔗 **[dist/xcom-enhanced-gallery.user.js를 클릭하여 설치](https://github.com/PiesP/xcom-enhanced-gallery/raw/master/dist/xcom-enhanced-gallery.user.js)**

> 💡 위 링크를 클릭하면 유저스크립트 매니저에서 자동으로 설치 화면이 나타납니다.

#### 방법 2: 릴리스에서 다운로드

[최신 릴리스](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest)에서 `xcom-enhanced-gallery.user.js` 파일을 다운로드하여 설치하세요.

### 3. X.com 방문

X.com에 접속하여 트윗의 이미지를 클릭하면 향상된 갤러리가 자동으로 활성화됩니다.

## 🚀 사용법

1. **갤러리 열기**: 트윗의 이미지/동영상 썸네일 클릭
2. **탐색**: 마우스 휠, 키보드 화살표, 또는 네비게이션 버튼 사용
3. **다운로드**: 툴바의 다운로드 버튼 클릭
   - 📥 단일 다운로드: 현재 보는 미디어만
   - 📦 전체 다운로드: 모든 미디어를 ZIP으로
4. **설정**: 이미지 피팅 모드 및 테마 설정 조정

## 🛠️ 기술 스택

### 📦 핵심 프레임워크

| 기술                | 버전     | 목적                                |
| ------------------- | -------- | ----------------------------------- |
| **Preact**          | v10.26.8 | 경량 React 호환 UI 프레임워크 (3KB) |
| **@preact/signals** | v2.2.0   | 반응형 상태 관리                    |
| **TypeScript**      | v5.8.3   | 타입 안전성 및 개발 생산성          |
| **fflate**          | v0.8.2   | ZIP 압축 라이브러리                 |

### 🏗️ 아키텍처 특징

- **Clean Architecture**: 계층 분리 및 의존성 역전
- **Feature-based 구조**: 기능별 모듈화
- **Tree Shaking**: 사용하지 않는 코드 자동 제거
- **CSS-in-JS**: 스타일 인라인화로 단일 파일 배포

## 🏛️ 프로젝트 구조

```
src/
├── app/                      # 애플리케이션 설정
├── features/                 # 기능별 모듈
│   ├── gallery/             # 갤러리 UI 및 상태 관리
│   ├── media/               # 미디어 추출 및 처리
│   └── settings/            # 설정 관리
├── shared/                   # 공통 재사용 모듈
│   ├── components/          # UI 컴포넌트
│   ├── utils/               # 유틸리티 함수
│   └── types/               # 공통 타입 정의
├── core/                    # 핵심 비즈니스 로직
│   ├── services/            # 서비스 계층
│   ├── state/               # 상태 관리 (Signals)
│   └── constants/           # 상수 정의
├── infrastructure/          # 외부 시스템 인터페이스
│   ├── logging/            # 로깅 시스템
│   ├── storage/            # 로컬 스토리지
│   └── browser/            # 브라우저 API
└── assets/                 # 정적 자원
```

## 🔧 개발 환경 설정

### 요구 사항

- **Node.js** ≥18
- **npm** ≥8

### 개발 시작

```bash
# 저장소 클론
git clone https://github.com/PiesP/xcom-enhanced-gallery.git
cd xcom-enhanced-gallery

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build
```

### 주요 스크립트

```bash
npm run dev          # 개발 모드 (파일 변경 감지)
npm run build        # 프로덕션 빌드
npm run build:dev    # 개발용 빌드 (소스맵 포함)
npm run test         # 테스트 실행
npm run test:watch   # 테스트 감시 모드
npm run lint         # 코드 품질 검사
npm run lint:fix     # 자동 코드 수정
npm run typecheck    # TypeScript 타입 검사
npm run validate     # 전체 검증 (빌드 전 필수)
```

### 코드 품질

- **ESLint**: 코딩 규칙 및 베스트 프랙티스 검사
- **Prettier**: 일관된 코드 포맷팅
- **TypeScript Strict**: 엄격한 타입 안전성
- **Vitest**: 빠른 유닛 테스트
- **Husky**: Git 훅을 통한 자동 품질 검사

## 🧪 테스트

### 유닛 테스트

```bash
npm run test              # 모든 테스트 실행
npm run test:watch        # 감시 모드
npm run test:coverage     # 커버리지 리포트
```

### E2E 테스트

```bash
cd test/e2e
npx @playwright/mcp@latest --browser chrome
```

## 🤝 기여하기

이 프로젝트는 AI 코딩 어시스턴트(GitHub Copilot)와의 협업으로 개발되었습니다. 기여를 환영합니다!

### 기여 방법

1. 저장소를 포크합니다
2. 새 기능 브랜치를 생성합니다: `git checkout -b feature/새기능`
3. 변경사항을 커밋합니다: `git commit -m 'feat: 새로운 기능 추가'`
4. 브랜치에 푸시합니다: `git push origin feature/새기능`
5. Pull Request를 생성합니다

### 개발 가이드라인

- [코딩 가이드라인](docs/CODING_GUIDELINES.md) 준수
- TypeScript strict 모드 사용
- Clean Architecture 원칙 적용
- 테스트 코드 작성 필수

자세한 내용은 [CONTRIBUTING.md](.github/CONTRIBUTING.md)를 참고하세요.

## 📋 로드맵

### 🎯 진행 중

- [ ] **성능 최적화**: 대용량 미디어 처리 개선
- [ ] **다국어 지원**: 일본어, 중국어 추가
- [ ] **설정 UI**: 사용자 커스터마이징 옵션 확장

### 🔮 계획 중

- [ ] **AI 자동 태깅**: 이미지 내용 기반 자동 분류
- [ ] **클라우드 동기화**: 설정 및 다운로드 히스토리 동기화
- [ ] **브라우저 확장**: 유저스크립트에서 확장 프로그램으로 포팅

## 🐛 알려진 이슈

- **Twitter API 변경**: Twitter의 API 변경 시 동영상 다운로드가 일시적으로 작동하지 않을 수 있습니다
- **큰 미디어 파일**: 매우 큰 동영상 파일의 경우 다운로드가 느릴 수 있습니다

이슈 발견 시 [GitHub Issues](https://github.com/PiesP/xcom-enhanced-gallery/issues)에 신고해 주세요.

## 📄 라이선스 및 저작권

### 프로젝트 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE) 하에 배포됩니다.

### 사용된 오픈소스 라이브러리

#### 핵심 라이브러리

- **[Preact](https://preactjs.com/)** (MIT) - Fast 3kB React alternative
- **[@preact/signals](https://github.com/preactjs/signals)** (MIT) - Reactive state management
- **[fflate](https://github.com/101arrowz/fflate)** (MIT) - High performance compression library

#### 개발 도구

- **[TypeScript](https://typescriptlang.org/)** (Apache-2.0) - Typed JavaScript
- **[Vite](https://vitejs.dev/)** (MIT) - Next generation build tool
- **[ESLint](https://eslint.org/)** (MIT) - JavaScript linter
- **[Prettier](https://prettier.io/)** (MIT) - Code formatter
- **[Vitest](https://vitest.dev/)** (MIT) - Blazing fast testing framework

#### 기타 의존성

전체 의존성 목록 및 라이선스는 `package.json`과 `npm ls` 명령으로 확인할 수 있습니다.

### AI 개발 도구 사용 고지

본 프로젝트는 **GitHub Copilot**의 도움을 받아 개발되었습니다:

- 코드 생성 및 리팩토링
- 문서 작성 및 개선
- 테스트 케이스 생성
- 아키텍처 설계 지원

AI 도구는 개발 효율성을 높이고 코드 품질을 향상시키는 보조 도구로 사용되었으며, 모든 코드는 인간 개발자에 의해 검토되고 승인되었습니다.

### 참고 프로젝트

동영상 추출 기능은 [Twitter Click'n'Save](https://github.com/AlttiRi/twitter-click-and-save) 프로젝트의 로직을 참고하여 구현되었습니다.

## 📞 지원 및 문의

- **버그 신고**: [GitHub Issues](https://github.com/PiesP/xcom-enhanced-gallery/issues)
- **기능 요청**: [Feature Request](https://github.com/PiesP/xcom-enhanced-gallery/issues/new?template=feature_request.md)
- **일반 문의**: [Discussions](https://github.com/PiesP/xcom-enhanced-gallery/discussions)

---

<div align="center">

**🎨 Made with ❤️ and 🤖 GitHub Copilot**

[⬆️ 맨 위로](#-xcom-enhanced-gallery)

</div>
