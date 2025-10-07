// 임시 스크립트: Hero 아이콘 패턴 통일
// HeroArrowAutofitWidth, HeroArrowsMaximize, HeroChevronLeft, HeroChevronRight,
// HeroDownload, HeroFileZip, HeroSettings, HeroZoomIn

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'src', 'shared', 'components', 'ui', 'Icon', 'hero');

const icons = [
  { file: 'HeroArrowAutofitWidth.solid.tsx', icon: 'ArrowsRightLeftIcon' },
  { file: 'HeroArrowsMaximize.solid.tsx', icon: 'ArrowsPointingOutIcon' },
  { file: 'HeroChevronLeft.solid.tsx', icon: 'ChevronLeftIcon' },
  { file: 'HeroChevronRight.solid.tsx', icon: 'ChevronRightIcon' },
  { file: 'HeroDownload.solid.tsx', icon: 'ArrowDownTrayIcon' },
  { file: 'HeroFileZip.solid.tsx', icon: 'ArchiveBoxArrowDownIcon' },
  { file: 'HeroSettings.solid.tsx', icon: 'Cog6ToothIcon' },
  { file: 'HeroZoomIn.solid.tsx', icon: 'MagnifyingGlassPlusIcon' },
];

const template = (funcName, iconName) => `/**
 * @fileoverview ${funcName} Icon Component (Solid.js)
 * @version 1.0.0 - Solid.js Hero ${funcName.replace('Hero', '')} Icon Adapter
 */

import { Dynamic } from 'solid-js/web';
import { mergeProps, splitProps, type Component } from 'solid-js';
import { Icon, type IconProps } from '../Icon.solid';
import { getHeroiconsOutline } from '@shared/external/vendors/heroicons-react';

export function ${funcName}(props: IconProps): ReturnType<Component> {
  const { ${iconName} } = getHeroiconsOutline();
  const merged = mergeProps({ size: 'var(--xeg-icon-size)' as string | number }, props);
  const [local, others] = splitProps(merged, ['size']);
  const sizeValue = () => (typeof local.size === 'number' ? \`\${local.size}px\` : local.size);

  return (
    <Icon size={local.size} {...others}>
      <Dynamic
        component={${iconName} as any}
        width={sizeValue()}
        height={sizeValue()}
        fill='none'
        stroke='var(--xeg-icon-color, currentColor)'
        strokeWidth='var(--xeg-icon-stroke-width)'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Icon>
  );
}
`;

icons.forEach(({ file, icon }) => {
  const funcName = file.replace('.solid.tsx', '');
  const content = template(funcName, icon);
  fs.writeFileSync(path.join(iconsDir, file), content);
  console.log(`✅ Updated ${file}`);
});

console.log('\\n✨ All Hero icons updated!');
