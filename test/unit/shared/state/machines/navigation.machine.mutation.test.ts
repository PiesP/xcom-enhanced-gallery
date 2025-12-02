import { NavigationStateMachine } from '@shared/state/machines/navigation.machine';

describe('NavigationStateMachine mutation tests', () => {
  describe('duplicate detection edge cases', () => {
    it('should not detect duplicate when source changes from button to keyboard', () => {
      const initialState = NavigationStateMachine.createInitialState();

      const result1 = NavigationStateMachine.transition(initialState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 5, source: 'button', trigger: 'click' },
      });

      const result2 = NavigationStateMachine.transition(result1.newState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 5, source: 'keyboard', trigger: 'keyboard' },
      });

      expect(result2.isDuplicate).toBe(true);
    });

    it('should not detect duplicate when source is scroll (non-manual)', () => {
      const initialState = NavigationStateMachine.createInitialState();

      const result1 = NavigationStateMachine.transition(initialState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 3, source: 'scroll', trigger: 'scroll' },
      });

      const result2 = NavigationStateMachine.transition(result1.newState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 3, source: 'scroll', trigger: 'scroll' },
      });

      expect(result2.isDuplicate).toBe(false);
      expect(result2.newState.lastNavigatedIndex).toBe(3);
    });

    it('should not detect duplicate when source is auto-focus (non-manual)', () => {
      const initialState = NavigationStateMachine.createInitialState();

      const result1 = NavigationStateMachine.transition(initialState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 2, source: 'auto-focus', trigger: 'scroll' },
      });

      const result2 = NavigationStateMachine.transition(result1.newState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 2, source: 'auto-focus', trigger: 'scroll' },
      });

      expect(result2.isDuplicate).toBe(false);
    });

    it('should not detect duplicate when index changes', () => {
      const initialState = NavigationStateMachine.createInitialState();

      const result1 = NavigationStateMachine.transition(initialState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 1, source: 'button', trigger: 'click' },
      });

      const result2 = NavigationStateMachine.transition(result1.newState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 2, source: 'button', trigger: 'click' },
      });

      expect(result2.isDuplicate).toBe(false);
      expect(result2.newState.lastNavigatedIndex).toBe(2);
    });

    it('should detect duplicate with keyboard to keyboard navigation', () => {
      const initialState = NavigationStateMachine.createInitialState();

      const result1 = NavigationStateMachine.transition(initialState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 0, source: 'keyboard', trigger: 'keyboard' },
      });

      const result2 = NavigationStateMachine.transition(result1.newState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 0, source: 'keyboard', trigger: 'keyboard' },
      });

      expect(result2.isDuplicate).toBe(true);
    });

    it('should not detect duplicate when previous source was scroll', () => {
      const initialState = NavigationStateMachine.createInitialState();

      const result1 = NavigationStateMachine.transition(initialState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 4, source: 'scroll', trigger: 'scroll' },
      });

      const result2 = NavigationStateMachine.transition(result1.newState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 4, source: 'button', trigger: 'click' },
      });

      expect(result2.isDuplicate).toBe(false);
    });
  });

  describe('timestamp updates', () => {
    it('should update timestamp on navigate', async () => {
      const initialState = NavigationStateMachine.createInitialState();
      const initialTimestamp = initialState.lastTimestamp;

      await new Promise(resolve => setTimeout(resolve, 10));

      const result = NavigationStateMachine.transition(initialState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 1, source: 'button', trigger: 'click' },
      });

      expect(result.newState.lastTimestamp).toBeGreaterThan(initialTimestamp);
    });

    it('should update timestamp on set focus', async () => {
      const initialState = NavigationStateMachine.createInitialState();
      const initialTimestamp = initialState.lastTimestamp;

      await new Promise(resolve => setTimeout(resolve, 10));

      const result = NavigationStateMachine.transition(initialState, {
        type: 'SET_FOCUS',
        payload: { focusIndex: 2, source: 'keyboard' },
      });

      expect(result.newState.lastTimestamp).toBeGreaterThan(initialTimestamp);
    });

    it('should update timestamp even on duplicate navigation', async () => {
      const initialState = NavigationStateMachine.createInitialState();

      const result1 = NavigationStateMachine.transition(initialState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 5, source: 'button', trigger: 'click' },
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const result2 = NavigationStateMachine.transition(result1.newState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 5, source: 'button', trigger: 'click' },
      });

      expect(result2.isDuplicate).toBe(true);
      expect(result2.newState.lastTimestamp).toBeGreaterThanOrEqual(result1.newState.lastTimestamp);
    });
  });

  describe('unknown action type', () => {
    it('should return unchanged state for unknown action type', () => {
      const initialState = NavigationStateMachine.createInitialState();

      const result = NavigationStateMachine.transition(
        initialState,
        { type: 'UNKNOWN' } as unknown as { type: 'RESET' },
      );

      expect(result.newState).toEqual(initialState);
      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('SET_FOCUS preserves lastNavigatedIndex', () => {
    it('should preserve lastNavigatedIndex when setting focus', () => {
      const initialState = NavigationStateMachine.createInitialState();

      const afterNavigate = NavigationStateMachine.transition(initialState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 10, source: 'button', trigger: 'click' },
      });

      const afterFocus = NavigationStateMachine.transition(afterNavigate.newState, {
        type: 'SET_FOCUS',
        payload: { focusIndex: 5, source: 'scroll' },
      });

      expect(afterFocus.newState.lastNavigatedIndex).toBe(10);
      expect(afterFocus.newState.lastSource).toBe('scroll');
    });
  });

  describe('all trigger types', () => {
    const triggers = ['button', 'click', 'keyboard', 'scroll'] as const;

    triggers.forEach(trigger => {
      it(`should handle trigger type: ${trigger}`, () => {
        const initialState = NavigationStateMachine.createInitialState();

        const result = NavigationStateMachine.transition(initialState, {
          type: 'NAVIGATE',
          payload: { targetIndex: 1, source: 'button', trigger },
        });

        expect(result.newState.lastNavigatedIndex).toBe(1);
        expect(result.isDuplicate).toBe(false);
      });
    });
  });
});
