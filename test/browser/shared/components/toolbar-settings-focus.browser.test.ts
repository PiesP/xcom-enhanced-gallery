// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { useToolbarSettingsController } from '@shared/hooks/toolbar/use-toolbar-settings-controller';
import { createRoot, createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@shared/services/theme-service', () => ({
  getThemeService: () => ({
    getCurrentTheme: () => 'auto',
    isInitialized: () => true,
    onThemeChange: () => () => undefined,
  }),
}));
vi.mock('@shared/services/language-service', () => ({
  getLanguageService: () => ({
    getCurrentLanguage: () => 'en',
    onLanguageChange: () => () => undefined,
  }),
}));

function mountController() {
  const [expanded, setExpanded] = createSignal(false);
  const controllerRoot = createRoot((dispose) => ({
    controller: useToolbarSettingsController({
      isSettingsExpanded: expanded,
      setSettingsExpanded: setExpanded,
      toggleSettingsExpanded: () => setExpanded((current) => !current),
    }),
    dispose,
  }));
  const button = document.createElement('button');
  const panel = document.createElement('section');
  const theme = document.createElement('select');
  const language = document.createElement('select');
  const video = document.createElement('select');
  panel.append(theme, language, video);
  document.body.append(button, panel);
  controllerRoot.controller.assignSettingsButtonRef(button);
  controllerRoot.controller.assignSettingsPanelRef(panel);
  button.focus();

  return {
    ...controllerRoot,
    button,
    panel,
    theme,
    video,
    open: () => controllerRoot.controller.handleSettingsClick(new MouseEvent('click')),
    close: () => setExpanded(false),
  };
}

describe('toolbar settings focus', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('focuses the first select when focus remains on the settings button', () => {
    const ui = mountController();
    try {
      ui.open();
      vi.advanceTimersByTime(50);
      expect(document.activeElement).toBe(ui.theme);
    } finally {
      ui.dispose();
    }
  });

  it('preserves a later explicit focus on the Video clicks select', () => {
    const ui = mountController();
    try {
      ui.open();
      ui.video.focus();
      vi.advanceTimersByTime(50);
      expect(document.activeElement).toBe(ui.video);
    } finally {
      ui.dispose();
    }
  });

  it('preserves a later explicit focus outside the settings panel', () => {
    const ui = mountController();
    const nextControl = document.createElement('button');
    document.body.append(nextControl);
    try {
      ui.open();
      nextControl.focus();
      vi.advanceTimersByTime(50);
      expect(document.activeElement).toBe(nextControl);
    } finally {
      ui.dispose();
    }
  });

  it('does not focus a closed or detached panel', () => {
    const ui = mountController();
    try {
      ui.open();
      ui.close();
      vi.advanceTimersByTime(50);
      expect(document.activeElement).toBe(ui.button);

      ui.open();
      ui.panel.remove();
      vi.advanceTimersByTime(50);
      expect(document.activeElement).toBe(ui.button);
    } finally {
      ui.dispose();
    }
  });

  it('does not focus after the controller is disposed', () => {
    const ui = mountController();
    ui.open();
    ui.dispose();
    vi.advanceTimersByTime(50);
    expect(document.activeElement).toBe(ui.button);
  });

  it('starts a fresh focus delay after a quick close and reopen', () => {
    const ui = mountController();
    try {
      ui.open();
      vi.advanceTimersByTime(25);
      ui.close();
      ui.open();
      vi.advanceTimersByTime(25);
      expect(document.activeElement).toBe(ui.button);
      vi.advanceTimersByTime(25);
      expect(document.activeElement).toBe(ui.theme);
    } finally {
      ui.dispose();
    }
  });

  it('restores the settings button after an isolated Escape', () => {
    const ui = mountController();
    try {
      ui.open();
      vi.advanceTimersByTime(50);
      expect(document.activeElement).toBe(ui.theme);

      ui.controller.handleToolbarKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));
      vi.advanceTimersByTime(50);
      expect(document.activeElement).toBe(ui.button);
    } finally {
      ui.dispose();
    }
  });

  it('does not restore settings focus after Help takes focus', () => {
    const ui = mountController();
    const help = document.createElement('button');
    document.body.append(help);
    try {
      ui.open();
      vi.advanceTimersByTime(50);
      expect(document.activeElement).toBe(ui.theme);

      ui.controller.handleToolbarKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));
      help.focus();
      vi.advanceTimersByTime(50);
      expect(document.activeElement).toBe(help);
    } finally {
      ui.dispose();
    }
  });

  it('cancels Escape focus restoration when settings reopens or the controller disposes', () => {
    const ui = mountController();
    let disposed = false;
    try {
      ui.open();
      vi.advanceTimersByTime(50);
      ui.controller.handleToolbarKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));
      ui.open();
      vi.advanceTimersByTime(50);
      expect(document.activeElement).toBe(ui.theme);

      ui.controller.handleToolbarKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));
      ui.dispose();
      disposed = true;
      vi.advanceTimersByTime(50);
      expect(document.activeElement).toBe(ui.theme);
    } finally {
      if (!disposed) ui.dispose();
    }
  });
});
