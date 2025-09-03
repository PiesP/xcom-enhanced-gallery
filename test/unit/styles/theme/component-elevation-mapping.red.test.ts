import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// RED: 컴포넌트 → Semantic Surface elevation 매핑 누락 검출
// 목표 GREEN: 각 주요 컴포넌트가 data 속성 혹은 클래스/토큰 선언을 통해 surface level 명시
// 대상: Toolbar (elevated), SettingsModal (overlay), Toast (overlay|elevated 재검토), Button (elevated)

interface ExpectedMapping {
  component: string;
  desired: string;
  filePath: string;
}

const EXPECTED: ExpectedMapping[] = [
  {
    component: 'Toolbar',
    desired: 'elevated',
    filePath: 'src/shared/components/ui/Toolbar/Toolbar.module.css',
  },
  {
    component: 'SettingsModal',
    desired: 'overlay',
    filePath: 'src/shared/components/ui/SettingsModal/SettingsModal.module.css',
  },
  {
    component: 'Toast',
    desired: 'overlay',
    filePath: 'src/shared/components/ui/Toast/Toast.module.css',
  },
];

describe('Phase22 Component Elevation Mapping (RED)', () => {
  it('should define semantic surface level markers for key components', async () => {
    const missing: string[] = [];

    for (const exp of EXPECTED) {
      try {
        // Read CSS file directly
        const cssFilePath = path.resolve(process.cwd(), exp.filePath);
        const cssContent = fs.readFileSync(cssFilePath, 'utf-8');

        // Check for surface level marker (e.g., --xeg-surface-level: elevated)
        const hasMarker = cssContent.includes(`--xeg-surface-level: ${exp.desired}`);

        if (!hasMarker) {
          missing.push(`${exp.component}:${exp.desired}:missing-marker`);
        }
      } catch (error) {
        missing.push(`${exp.component}:${exp.desired}:file-read-error`);
      }
    }

    expect(missing).toEqual([]); // GREEN 단계에서 marker 추가 후 통과 예정
  });
});
