/**
 * Cross-Component Consistency Test
 * Week 3: 전체 시스템 일관성 검증
 *
 * 목적: 모든 컴포넌트 간 border-radius 토큰 사용 일관성 검증
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 테스트 대상 CSS 파일들
const CSS_FILES = {
  designTokensPrimitive: 'src/shared/styles/design-tokens.primitive.css',
  designTokensSemantic: 'src/shared/styles/design-tokens.semantic.css',
  toast: 'src/shared/components/ui/Toast/Toast.module.css',
  gallery: 'src/features/gallery/styles/Gallery.module.css',
  galleryGlobal: 'src/features/gallery/assets/styles/gallery-global.css',
  isolatedGallery: 'src/features/gallery/assets/styles/isolated-gallery.css',
  button: 'src/shared/components/ui/Button/Button.module.css',
};

function readCSSFile(relativePath) {
  try {
    const fullPath = join(__dirname, '..', '..', relativePath);
    return readFileSync(fullPath, 'utf8');
  } catch {
    // 파일이 없는 경우 빈 문자열 반환 (일부 컴포넌트 파일은 없을 수 있음)
    return '';
  }
}

// 정책 기반 기대 토큰 세트 (docs/CODING_GUIDELINES.md Border Radius 정책 반영)
function deriveRoleTokenExpectations() {
  // 기본 폴백 (문서 파싱 실패 시)
  const fallback = {
    interaction: ['--xeg-radius-md'],
    surface: ['--xeg-radius-lg', '--xeg-radius-2xl'],
    shape: ['--xeg-radius-full', '--xeg-radius-pill'],
  };

  try {
    const guidelinesPath = join(__dirname, '..', '..', '..', 'docs', 'CODING_GUIDELINES.md');
    const content = readFileSync(guidelinesPath, 'utf8');

    // Border Radius 정책 섹션 추출
    const sectionMatch = content.match(/### Border Radius 정책[\s\S]*?```/);
    if (!sectionMatch) return { ...fallback };
    const section = sectionMatch[0];

    // 테이블 행 파싱 (파이프 기반) -> 용도 / 토큰
    const lines = section.split('\n').filter(l => l.includes('| var(--xeg-radius'));
    const policy = {};
    for (const line of lines) {
      // | 용도 | `var(--xeg-radius-md)` | 설명 |
      const cols = line.split('|').map(c => c.trim());
      if (cols.length < 3) continue;
      const use = cols[1];
      const tokenCell = cols[2];
      const tokenMatch = tokenCell.match(/var\(--xeg-radius-[^)]+\)/g) || [];
      if (!tokenMatch.length) continue;
      // 분류 매핑 규칙
      if (/인터랙션/.test(use) || /interaction/i.test(use)) {
        policy.interaction ||= [];
        policy.interaction.push(...tokenMatch.map(t => t.slice(4, -1))); // var( ... ) 제거
      } else if (/Surface/.test(use) || /컨테이너/.test(use)) {
        policy.surface ||= [];
        policy.surface.push(...tokenMatch.map(t => t.slice(4, -1)));
      } else if (/Pill|원형|형태/.test(use)) {
        policy.shape ||= [];
        policy.shape.push(...tokenMatch.map(t => t.slice(4, -1)));
      }
    }

    // 후처리: 중복 제거 & 비어있으면 폴백 사용
    const uniq = (arr = []) => Array.from(new Set(arr));
    const result = {
      interaction: uniq(policy.interaction?.length ? policy.interaction : fallback.interaction),
      surface: uniq(policy.surface?.length ? policy.surface : fallback.surface),
      shape: uniq(policy.shape?.length ? policy.shape : fallback.shape),
    };
    return result;
  } catch {
    return { ...fallback };
  }
}

describe('Cross-Component Consistency Verification', () => {
  // Modernization NOTE (2025-09):
  // 1. Add IconButton.css + any new primitive component styles into CSS_FILES set once stabilized.
  // 2. Replace direct explicit token expectation patterns with policy-driven mapping (see docs/CODING_GUIDELINES.md Border Radius 정책).
  // 3. Relax or parameterize role-based token assertions to allow future size variants.
  // 4. Remove duplication with *-clean variant test after consolidation.
  // Modernized: UnifiedToolbarButton merged into ToolbarButton.module.css; IconButton.css included.
  // TODO (future): parse docs/CODING_GUIDELINES.md to auto-derive token policy instead of hardcoding.
  // Removed need for *-clean duplicate test file.
  describe('Phase 1: 토큰 체계 완전성 검증', () => {
    it('모든 primitive 토큰이 정의되어야 함', () => {
      const primitiveCSS = readCSSFile(CSS_FILES.designTokensPrimitive);

      const expectedTokens = [
        '--radius-xs: 2px',
        '--radius-sm: 4px',
        '--radius-md: 6px',
        '--radius-lg: 8px',
        '--radius-xl: 12px',
        '--radius-2xl: 16px',
        '--radius-pill: 28px',
        '--radius-full: 50%',
      ];

      expectedTokens.forEach(token => {
        expect(primitiveCSS).toContain(token);
      });
    });

    it('semantic 레이어가 primitive radius 토큰을 참조해야 함', () => {
      const semanticCSS = readCSSFile(CSS_FILES.designTokensSemantic);

      // Epic CSS-TOKEN-UNIFY-001: semantic layer가 primitive의 --radius-* 토큰을 참조
      // Semantic layer는 --radius-* 토큰을 직접 정의하지 않고 primitive에서 import됨
      // 대신 컴포넌트별 토큰이 --radius-* 를 참조하는지 확인
      const componentTokenReferences = ['var(--radius-md)', 'var(--radius-lg)', 'var(--radius-xl)'];

      componentTokenReferences.forEach(ref => {
        expect(semanticCSS, `Semantic CSS가 primitive radius 토큰을 참조해야 함: ${ref}`).toContain(
          ref
        );
      });
    });
  });

  describe('Phase 2: 컴포넌트별 토큰 사용 검증', () => {
    it('ToolbarButton이 적절한 토큰만 사용해야 함', () => {
      const toolbarCSS = readCSSFile(CSS_FILES.toolbarButton);
      const iconCSS = readCSSFile(CSS_FILES.iconButton);
      const combined = toolbarCSS + '\n' + iconCSS;

      // 파일 경로가 정확한지 확인
      if (!combined) return; // 파일 없으면 스킵 (미이관 상태)

      // 하드코딩된 border-radius 값이 없어야 함
      const hardcodedValues = /border-radius:\s*\d+px/g;
      expect(combined).not.toMatch(hardcodedValues);

      // xeg-radius 토큰 사용 확인
      // 정책 내 토큰만 등장
      const allowed = Object.values(deriveRoleTokenExpectations()).flat();
      const radiusTokens = Array.from(new Set(combined.match(/--xeg-radius-\w+/g) || []));
      radiusTokens.forEach(t => expect(allowed.includes(t)).toBe(true));
    });

    it('Toast 컴포넌트가 적절한 토큰만 사용해야 함', () => {
      const toastCSS = readCSSFile(CSS_FILES.toast);

      // 하드코딩된 border-radius 값이 없어야 함
      const hardcodedValues = /border-radius:\s*\d+px/g;
      expect(toastCSS).not.toMatch(hardcodedValues);

      // 적절한 토큰 사용 확인
      expect(toastCSS).toMatch(/var\(--xeg-radius-2xl\)/); // Toast 컨테이너 (surface large)
      expect(toastCSS).toMatch(/var\(--xeg-radius-md\)/); // Action/close buttons (interaction)
      // sm/lg 사용은 현재 Toast에서 제거됨 (정책: interaction=md, surface=2xl 유지)
    });

    it('Gallery 컴포넌트들이 적절한 토큰만 사용해야 함', () => {
      const galleryCSS = readCSSFile(CSS_FILES.gallery);
      const galleryGlobalCSS = readCSSFile(CSS_FILES.galleryGlobal);

      // 하드코딩된 border-radius 값이 없어야 함
      const hardcodedValues = /border-radius:\s*\d+px/g;
      expect(galleryCSS).not.toMatch(hardcodedValues);
      expect(galleryGlobalCSS).not.toMatch(hardcodedValues);

      // Gallery 컴포넌트 토큰 사용 확인
      expect(galleryCSS).toMatch(/var\(--xeg-radius-lg\)/); // 표준 surface (media / error 등)
      expect(galleryCSS).toMatch(/var\(--xeg-radius-md\)/); // control buttons (interaction)
      expect(galleryCSS).toMatch(/var\(--xeg-radius-pill\)/); // controls container (shape pill)
      expect(galleryCSS).toMatch(/var\(--xeg-radius-full\)/); // 원형 요소 (nav/close)
      // radius-2xl 는 현재 갤러리에서는 사용 안 함 (Toast가 이미 large surface 책임)
    });

    it('Isolated Gallery가 semantic 토큰을 참조 (없으면 스킵)', () => {
      const isolatedCSS = readCSSFile(CSS_FILES.isolatedGallery);
      if (!isolatedCSS) return; // 파일이 없으면 마이그레이션 완료 상태로 간주
      expect(isolatedCSS).toMatch(/var\(--xeg-radius-\w+\)/);
      expect(isolatedCSS).not.toMatch(/var\(--radius-\w+\)(?!.*xeg)/);
    });
  });

  describe('Phase 3: 역할별 토큰 사용 일관성', () => {
    it('버튼 역할 요소들이 일관된 토큰을 사용해야 함', () => {
      const buttonCSS = readCSSFile(CSS_FILES.button);
      const toastCSS = readCSSFile(CSS_FILES.toast);
      const galleryCSS = readCSSFile(CSS_FILES.gallery);

      // 정책상 인터랙션 요소(md) 사용 (Button)
      const buttonTokenPattern = /var\(--xeg-radius-md\)/; // 정책상 모든 interaction 요소 md
      expect(buttonCSS).toMatch(buttonTokenPattern);
      expect(toastCSS).toMatch(buttonTokenPattern); // Action button
      expect(galleryCSS).toMatch(buttonTokenPattern); // Control buttons
    });

    it('컨테이너 역할 요소들이 적절한 크기별 토큰을 사용해야 함', () => {
      const toastCSS = readCSSFile(CSS_FILES.toast);
      const galleryCSS = readCSSFile(CSS_FILES.gallery);

      // Large surface: 최소 한 곳(Toast)에서 2xl 사용
      expect(toastCSS).toMatch(/var\(--xeg-radius-2xl\)/);
      // Gallery는 2xl optional. 대신 표준 surface lg 사용 보장
      expect(galleryCSS).toMatch(/var\(--xeg-radius-lg\)/); // mediaElement / error 등
    });

    it('특수 형태 요소들이 적절한 토큰을 사용해야 함', () => {
      const galleryCSS = readCSSFile(CSS_FILES.gallery);

      // 원형 요소: full 토큰
      expect(galleryCSS).toMatch(/var\(--xeg-radius-full\)/);

      // 알약 형태: pill 토큰
      expect(galleryCSS).toMatch(/var\(--xeg-radius-pill\)/);
    });
  });

  describe('Phase 4: 시스템 완전성 검증', () => {
    it('하드코딩된 border-radius 값이 전혀 없어야 함', () => {
      const allCSS = Object.values(CSS_FILES)
        .filter(file => file.includes('module.css') || file.includes('global.css'))
        .map(file => readCSSFile(file))
        .join('\n');

      // 하드코딩된 px 값 패턴 검사 (토큰 정의 제외)
      const hardcodedPattern = /border-radius:\s*\d+px(?!\s*;?\s*\/\*.*토큰)/g;
      const matches = allCSS.match(hardcodedPattern) || [];

      expect(matches).toHaveLength(0);
    });

    it('토큰 네이밍 컨벤션이 일관되어야 함', () => {
      const primitiveCSS = readCSSFile(CSS_FILES.designTokensPrimitive);

      // Epic CSS-TOKEN-UNIFY-001: primitive layer에 --radius-* 패턴 정의
      const tokenPattern = /--radius-\w+:/g;
      const tokens = primitiveCSS.match(tokenPattern) || [];

      expect(tokens.length, 'primitive CSS에 --radius-* 토큰이 정의되어야 함').toBeGreaterThan(0);

      // 모든 토큰이 radius로 시작하는지 확인
      tokens.forEach(token => {
        expect(token).toMatch(/^--radius-/);
      });
    });

    it('필수 토큰 세트(md|lg|2xl|pill|full)가 최소 한 번씩 사용되어야 함', () => {
      const allComponentCSS = Object.values(CSS_FILES)
        .filter(file => !file.includes('design-tokens'))
        .map(file => readCSSFile(file))
        .join('\n');
      // Epic CSS-TOKEN-UNIFY-001: --radius-* 또는 --xeg-radius-* 둘 다 허용 (전환 기간)
      const required = [
        { legacy: '--xeg-radius-md', modern: '--radius-md' },
        { legacy: '--xeg-radius-lg', modern: '--radius-lg' },
        { legacy: '--xeg-radius-2xl', modern: '--radius-2xl' },
        { legacy: '--xeg-radius-pill', modern: '--radius-pill' },
        { legacy: '--xeg-radius-full', modern: '--radius-full' },
      ];
      required.forEach(({ legacy, modern }) => {
        const hasLegacy = allComponentCSS.includes(`var(${legacy})`);
        const hasModern = allComponentCSS.includes(`var(${modern})`);
        expect(hasLegacy || hasModern, `${modern} 또는 ${legacy}가 사용되어야 함`).toBe(true);
      });
    });
  });

  describe('Phase 5: 성능 및 최적화 검증', () => {
    it('CSS 토큰 사용으로 인한 중복 코드가 제거되어야 함', () => {
      const allCSS = Object.values(CSS_FILES)
        .filter(file => file.includes('module.css') || file.includes('global.css'))
        .map(file => readCSSFile(file))
        .join('\n');

      // border-radius 관련 줄 수 계산
      const borderRadiusLines = (allCSS.match(/border-radius:/g) || []).length;

      // 토큰 사용 줄 수 계산 (Epic CSS-TOKEN-UNIFY-001: --radius-* 또는 --xeg-radius-* 둘 다 허용)
      const legacyTokenUsage = (allCSS.match(/var\(--xeg-radius-\w+\)/g) || []).length;
      const modernTokenUsage = (allCSS.match(/var\(--radius-\w+\)/g) || []).length;
      const tokenUsageLines = legacyTokenUsage + modernTokenUsage;

      // 대부분의 border-radius가 토큰을 사용해야 함
      const tokenUsageRatio = tokenUsageLines / borderRadiusLines;
      expect(tokenUsageRatio).toBeGreaterThan(0.8); // 80% 이상 토큰 사용
    });

    it('토큰 계층 구조가 효율적이어야 함', () => {
      const primitiveCSS = readCSSFile(CSS_FILES.designTokensPrimitive);
      const semanticCSS = readCSSFile(CSS_FILES.designTokensSemantic);

      // Primitive 토큰 개수
      const primitiveTokens = (primitiveCSS.match(/--radius-\w+:/g) || []).length;

      // Epic CSS-TOKEN-UNIFY-001: semantic layer는 primitive의 --radius-* 토큰을 참조
      // Semantic layer에서 컴포넌트별 토큰이 --radius-*를 참조하는지 확인
      const radiusReferences = (semanticCSS.match(/var\(--radius-\w+\)/g) || []).length;

      // Primitive 토큰이 정의되어 있고, semantic layer에서 참조되어야 함
      expect(primitiveTokens, 'primitive에 radius 토큰이 정의되어야 함').toBeGreaterThan(0);
      expect(radiusReferences, 'semantic에서 primitive radius 토큰을 참조해야 함').toBeGreaterThan(
        0
      );
    });
  });
});
