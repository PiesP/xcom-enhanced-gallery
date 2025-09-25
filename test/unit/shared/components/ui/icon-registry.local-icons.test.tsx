import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/preact';

import { XEG_ICON_COMPONENTS, getXegIconComponent } from '@shared/components/ui/Icon/icons';
import { XEG_ICON_DEFINITIONS } from '@assets/icons/xeg-icons';

describe('local icon registry', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders download icon metadata via SvgIcon factory', () => {
    const DownloadIcon = getXegIconComponent('Download');

    render(<DownloadIcon aria-label='download icon' data-testid='download-icon' />);

    const svgElement = screen.getByLabelText('download icon');

    expect(svgElement).toHaveAttribute('data-icon-name', 'download');
    expect(svgElement).toHaveAttribute('viewBox', XEG_ICON_DEFINITIONS.download.viewBox);

    const renderedPaths = svgElement.querySelectorAll('path');
    expect(renderedPaths).toHaveLength(XEG_ICON_DEFINITIONS.download.paths.length);
    XEG_ICON_DEFINITIONS.download.paths.forEach((pathDefinition, index) => {
      const renderedPath = renderedPaths[index];
      expect(renderedPath).toHaveAttribute('d', pathDefinition.d);

      if (pathDefinition.fill) {
        expect(renderedPath).toHaveAttribute('fill', pathDefinition.fill);
      }
      if (pathDefinition.strokeLinecap) {
        expect(renderedPath).toHaveAttribute('stroke-linecap', pathDefinition.strokeLinecap);
      }
      if (pathDefinition.strokeLinejoin) {
        expect(renderedPath).toHaveAttribute('stroke-linejoin', pathDefinition.strokeLinejoin);
      }
      if (typeof pathDefinition.strokeMiterlimit !== 'undefined') {
        expect(renderedPath).toHaveAttribute(
          'stroke-miterlimit',
          String(pathDefinition.strokeMiterlimit)
        );
      }
    });
  });

  it('exposes icon component names defined in the registry', () => {
    const iconNames = Object.keys(XEG_ICON_COMPONENTS);

    expect(iconNames).toContain('Download');
    expect(iconNames).toContain('Settings');
    expect(iconNames).toContain('Close');
  });
});
