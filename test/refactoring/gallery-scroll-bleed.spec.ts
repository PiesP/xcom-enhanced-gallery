/**
 * @fileoverview Gallery scroll bleed refactoring test (RED phase)
 * 목표: 작은 이미지(컨텐츠 높이 < 뷰포트) 상황에서 배경 페이지로 스크롤이 전파되지 않도록
 *       갤러리 최상위 컨테이너(.container) 레벨에 overscroll containment 속성을 반드시 두어야 한다.
 * 현 상태: .itemsList 안에는 @supports (overscroll-behavior: contain) 규칙이 있으나
 *          최상위 .container 에는 해당 속성이 없어 컨텐츠가 짧을 때 delta가 body로 체이닝 가능.
 * 이 테스트는 .container 블록 안에 overscroll-behavior: contain 이 포함되어 있는지를 검사한다.
 * 초기 실행에서는 실패(RED)해야 하며, CSS 수정 후 GREEN 으로 전환한다.
 */
/* eslint-env node */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

describe('Gallery scroll bleed prevention (refactoring)', () => {
  // 테스트는 ESM 환경. import.meta.url 에서 루트까지 상대 경로 계산.
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  // 루트: test 디렉터리 상위 (프로젝트 루트)
  const projectRoot = join(__dirname, '..', '..');
  const cssPath = join(
    projectRoot,
    'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
  );

  it('should declare overscroll containment on root gallery .container to prevent scroll chaining', () => {
    const css = readFileSync(cssPath, 'utf8');

    // 방어적: 파일에 .container 룰이 존재해야 한다
    expect(css.includes('.container')).toBe(true);

    // 요구: .container 블록 내부에 overscroll-behavior: contain 존재
    const containerBlockRegex = /\.container\s*{[^}]*}/g; // 첫 간단 매칭 (중첩 없음을 가정)
    const blocks = css.match(containerBlockRegex) || [];
    const hasContain = blocks.some(b => /overscroll-behavior:\s*contain/.test(b));

    expect(hasContain).toBe(true); // 현재는 false 여서 실패 (RED)
  });
});
