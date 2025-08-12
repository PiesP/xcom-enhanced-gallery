import { describe, it, expect, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import { glob } from 'glob';

interface HardcodedColorRule {
  pattern: RegExp;
  tokenName: string;
  description: string;
}

interface HardcodedColorViolation {
  file: string;
  line: number;
  content: string;
  rule: HardcodedColorRule;
  suggestedToken: string;
}

/**
 * 하드코딩된 색상 감지 도구
 * TDD Phase 1: RED - 하드코딩된 색상을 감지하는 테스트
 */
export class HardcodedColorDetector {
  private rules: HardcodedColorRule[] = [
    // 툴바 배경 하드코딩
    {
      pattern: /rgba\(0,\s*0,\s*0,\s*0\.95\)/g,
      tokenName: '--xeg-overlay-dark-primary',
      description: '다크 오버레이 기본 (95% 투명도)',
    },
    {
      pattern: /rgba\(0,\s*0,\s*0,\s*0\.8\)/g,
      tokenName: '--xeg-overlay-dark-secondary',
      description: '다크 오버레이 보조 (80% 투명도)',
    },
    // 라이트 오버레이
    {
      pattern: /rgba\(255,\s*255,\s*255,\s*0\.9[0-9]\)/g,
      tokenName: '--xeg-overlay-light-primary',
      description: '라이트 오버레이 기본',
    },
    // 순수 색상 하드코딩
    {
      pattern: /background:\s*black\s*[;}]/g,
      tokenName: '--xeg-bg-solid-dark',
      description: '순수 검정 배경',
    },
    {
      pattern: /background:\s*white\s*[;}]/g,
      tokenName: '--xeg-bg-solid-light',
      description: '순수 흰색 배경',
    },
    {
      pattern: /rgb\(0,\s*0,\s*0\)/g,
      tokenName: '--xeg-color-solid-dark',
      description: '순수 검정색',
    },
    {
      pattern: /rgb\(255,\s*255,\s*255\)/g,
      tokenName: '--xeg-color-solid-light',
      description: '순수 흰색',
    },
    // 투명도별 흰색/검정
    {
      pattern: /rgba\(255,\s*255,\s*255,\s*0\.([0-9]+)\)/g,
      tokenName: '--xeg-white-alpha-$1',
      description: '투명도 있는 흰색',
    },
    {
      pattern: /rgba\(0,\s*0,\s*0,\s*0\.([0-9]+)\)/g,
      tokenName: '--xeg-black-alpha-$1',
      description: '투명도 있는 검정색',
    },
    // 특정 그라디언트 패턴
    {
      pattern: /linear-gradient\(.*black.*rgba\(0,\s*0,\s*0,.*\)/g,
      tokenName: '--xeg-toolbar-overlay-gradient',
      description: '툴바 그라디언트 배경',
    },
    // color-mix 하드코딩 패턴
    {
      pattern: /color-mix\(in srgb, black \d+%, transparent\)/g,
      tokenName: '--xeg-overlay-mix-*',
      description: 'color-mix 하드코딩',
    },
  ];

  async scanDirectory(dirPath: string): Promise<HardcodedColorViolation[]> {
    const violations: HardcodedColorViolation[] = [];
    const files = await this.getStyleFiles(dirPath);

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          this.rules.forEach(rule => {
            const matches = Array.from(line.matchAll(rule.pattern));
            for (let i = 0; i < matches.length; i++) {
              violations.push({
                file: file.replace(process.cwd(), '').replace(/\\/g, '/'),
                line: index + 1,
                content: line.trim(),
                rule,
                suggestedToken: rule.tokenName,
              });
            }
          });
        });
      } catch (error) {
        console.warn(`Failed to read file ${file}:`, error);
      }
    }

    return violations;
  }

  private async getStyleFiles(dirPath: string): Promise<string[]> {
    const patterns = [
      `${dirPath}/**/*.css`,
      `${dirPath}/**/*.module.css`,
      `${dirPath}/**/*.scss`,
      `${dirPath}/**/*.sass`,
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
      try {
        const matches = await glob(pattern, {
          ignore: ['**/node_modules/**', '**/coverage/**', '**/dist/**', '**/build/**'],
        });
        files.push(...matches);
      } catch (error) {
        console.warn(`Failed to glob pattern ${pattern}:`, error);
      }
    }

    return [...new Set(files)]; // 중복 제거
  }

  /**
   * 하드코딩된 색상을 토큰으로 대체하는 제안 생성
   */
  generateMigrationSuggestions(violations: HardcodedColorViolation[]): Array<{
    file: string;
    suggestions: Array<{
      line: number;
      original: string;
      suggested: string;
      reason: string;
    }>;
  }> {
    const fileGroups = violations.reduce(
      (acc, violation) => {
        if (!acc[violation.file]) {
          acc[violation.file] = [];
        }
        acc[violation.file].push(violation);
        return acc;
      },
      {} as Record<string, HardcodedColorViolation[]>
    );

    return Object.entries(fileGroups).map(([file, fileViolations]) => ({
      file,
      suggestions: fileViolations.map(violation => ({
        line: violation.line,
        original: violation.content,
        suggested: violation.content.replace(
          violation.rule.pattern,
          `var(${violation.suggestedToken})`
        ),
        reason: violation.rule.description,
      })),
    }));
  }
}

describe('하드코딩된 색상 감지 - Phase 1 (RED)', () => {
  let detector: HardcodedColorDetector;

  beforeEach(() => {
    detector = new HardcodedColorDetector();
  });

  it('툴바 배경에서 하드코딩된 rgba(0,0,0,0.95)를 감지해야 함', async () => {
    const violations = await detector.scanDirectory('src/features/gallery');

    const toolbarViolations = violations.filter(
      v => v.content.includes('rgba(0, 0, 0, 0.95)') || v.content.includes('rgba(0,0,0,0.95)')
    );

    expect(toolbarViolations.length).toBeGreaterThan(0);

    toolbarViolations.forEach(violation => {
      console.log(`🔍 발견된 하드코딩: ${violation.file}:${violation.line}`);
      console.log(`   내용: ${violation.content}`);
      console.log(`   제안: ${violation.suggestedToken}`);
    });

    // 최소 1개 이상의 하드코딩된 배경색이 감지되어야 함
    expect(toolbarViolations.some(v => v.suggestedToken === '--xeg-overlay-dark-primary')).toBe(
      true
    );
  });

  it('순수 검정/흰색 하드코딩을 감지해야 함', async () => {
    const violations = await detector.scanDirectory('src');

    const solidColorViolations = violations.filter(
      v =>
        v.rule.tokenName.includes('solid') ||
        v.content.includes('background: black') ||
        v.content.includes('background: white')
    );

    expect(solidColorViolations.length).toBeGreaterThan(0);

    solidColorViolations.forEach(violation => {
      console.log(`🎨 순수 색상 하드코딩: ${violation.file}:${violation.line}`);
      console.log(`   내용: ${violation.content}`);
      console.log(`   제안: ${violation.suggestedToken}`);
    });

    // 하드코딩된 순수 색상들이 적절한 토큰으로 대체 제안되어야 함
    expect(
      solidColorViolations.some(
        v =>
          v.suggestedToken.includes('--xeg-bg-solid-') ||
          v.suggestedToken.includes('--xeg-color-solid-')
      )
    ).toBe(true);
  });

  it('모든 그라디언트 하드코딩을 감지해야 함', async () => {
    const violations = await detector.scanDirectory('src');

    const gradientViolations = violations.filter(
      v =>
        v.content.includes('linear-gradient') &&
        (v.content.includes('black') || v.content.includes('rgba(0, 0, 0'))
    );

    expect(gradientViolations.length).toBeGreaterThan(0);

    gradientViolations.forEach(violation => {
      console.log(`🌈 그라디언트 하드코딩: ${violation.file}:${violation.line}`);
      console.log(`   내용: ${violation.content.slice(0, 100)}...`);
      console.log(`   제안: ${violation.suggestedToken}`);
    });

    // 툴바 그라디언트 토큰 제안이 있어야 함
    expect(
      gradientViolations.some(v => v.suggestedToken.includes('--xeg-toolbar-overlay-gradient'))
    ).toBe(true);
  });

  it('color-mix 하드코딩을 감지해야 함', async () => {
    const violations = await detector.scanDirectory('src');

    const colorMixViolations = violations.filter(
      v =>
        v.content.includes('color-mix') &&
        (v.content.includes('black') || v.content.includes('white'))
    );

    if (colorMixViolations.length > 0) {
      colorMixViolations.forEach(violation => {
        console.log(`🎭 color-mix 하드코딩: ${violation.file}:${violation.line}`);
        console.log(`   내용: ${violation.content}`);
        console.log(`   제안: ${violation.suggestedToken}`);
      });

      expect(colorMixViolations.some(v => v.suggestedToken.includes('--xeg-overlay-mix'))).toBe(
        true
      );
    }
  });

  it('마이그레이션 제안을 생성해야 함', async () => {
    const violations = await detector.scanDirectory('src');
    const suggestions = detector.generateMigrationSuggestions(violations);

    expect(suggestions.length).toBeGreaterThan(0);

    suggestions.forEach(fileSuggestion => {
      console.log(`📋 ${fileSuggestion.file} 마이그레이션 제안:`);
      fileSuggestion.suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. Line ${suggestion.line}: ${suggestion.reason}`);
        console.log(`     변경 전: ${suggestion.original.slice(0, 80)}...`);
        console.log(`     변경 후: ${suggestion.suggested.slice(0, 80)}...`);
      });
      console.log('');
    });

    // 각 제안이 올바른 구조를 가져야 함
    suggestions.forEach(fileSuggestion => {
      expect(fileSuggestion.file).toMatch(/\.(css|scss|sass)$/);
      expect(fileSuggestion.suggestions.length).toBeGreaterThan(0);

      fileSuggestion.suggestions.forEach(suggestion => {
        expect(suggestion.line).toBeGreaterThan(0);
        expect(suggestion.original).toBeTruthy();
        expect(suggestion.suggested).toBeTruthy();
        expect(suggestion.reason).toBeTruthy();
        expect(suggestion.suggested).toContain('var(--xeg-');
      });
    });
  });

  it('특정 파일들에서 예상되는 하드코딩을 감지해야 함', async () => {
    // 주요 파일들에서 하드코딩 검증
    const criticalFiles = [
      'src/features/gallery/components/GalleryView.module.css',
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css',
      'src/shared/components/ui/Toolbar/Toolbar.module.css',
    ];

    for (const filePath of criticalFiles) {
      const violations = await detector.scanDirectory('src');
      const fileViolations = violations.filter(v => v.file.includes(filePath.replace('src/', '')));

      console.log(`🎯 ${filePath}에서 발견된 하드코딩: ${fileViolations.length}개`);

      if (fileViolations.length > 0) {
        fileViolations.forEach(violation => {
          console.log(`   Line ${violation.line}: ${violation.rule.description}`);
        });
      }

      // 각 주요 파일에서 최소 1개 이상의 하드코딩이 감지되어야 함
      expect(fileViolations.length).toBeGreaterThan(0);
    }
  });
});
