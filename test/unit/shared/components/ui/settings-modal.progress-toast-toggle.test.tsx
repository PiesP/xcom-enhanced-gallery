/**
 * SettingsModal – progress toast toggle
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/preact';
import { SettingsModal } from '@/shared/components/ui/SettingsModal/SettingsModal';

// Bridge mock for settings-access
vi.mock('@/shared/container/settings-access', async () => {
  const store: Record<string, unknown> = Object.create(null);
  return {
    getSetting: <T,>(key: string, defaultValue: T): T => {
      return (store[key] as T) ?? defaultValue;
    },
    setSetting: async <T,>(key: string, value: T): Promise<void> => {
      store[key] = value as unknown as never;
    },
  };
});

// Speed up i18n to English
vi.stubGlobal('navigator', { language: 'en-US' } as any);

describe('SettingsModal – progress toast toggle', () => {
  const baseProps = { isOpen: true, onClose: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the toggle and reflects default false', () => {
    render(<SettingsModal {...baseProps} />);

    const label = screen.getByText('Show progress toast during bulk download');
    expect(label).toBeDefined();

    const checkbox = screen.getByLabelText('Show progress toast during bulk download', {
      selector: 'input[type="checkbox"]',
    }) as any;

    // Fallback query by id when aria-label is not present
    const cb = checkbox || (document.getElementById('download-progress-toast') as any);
    expect(cb).toBeTruthy();
    expect(cb!.checked).toBe(false);
  });

  it('can be toggled and persists via settings-access', async () => {
    render(<SettingsModal {...baseProps} />);

    const input = document.getElementById('download-progress-toast') as any;
    expect(input).toBeTruthy();

    fireEvent.click(input);
    expect(input.checked).toBe(true);

    // Re-render to verify persisted value is loaded
    cleanup();
    render(<SettingsModal {...baseProps} />);
    const input2 = document.getElementById('download-progress-toast') as any;
    expect(input2.checked).toBe(true);
  });
});
