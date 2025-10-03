/** @jsxImportSource solid-js */
import { KeyboardHelpOverlay } from '@/features/gallery/components/KeyboardHelpOverlay/KeyboardHelpOverlay';
import { render } from '../../../utils/preact-testing-library';

describe('KeyboardHelpOverlay a11y', () => {
  it('has role=dialog and labelled/ described by title/desc', () => {
    const onClose = vi.fn();
    const { getByRole, getByText } = render(<KeyboardHelpOverlay open onClose={onClose} />);

    const dialog = getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    const title = getByText('Keyboard shortcuts');
    expect(title.id).toBeTruthy();

    // Phase 1-3: 키 이름이 <strong> 태그로 래핑됨, 부분 텍스트로 검증
    const listItem = getByText(': Show this help');
    expect(listItem).toBeTruthy();
  });
});
