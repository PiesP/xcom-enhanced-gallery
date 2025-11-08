/**
 * Settings State Machine
 *
 * Explicitly manages settings panel modal state via state machine
 *
 * State flow:
 * closed ←→ opening → open → closing → closed
 *  ↑↓ (force close possible)
 */

export type SettingsStatus = 'closed' | 'opening' | 'open' | 'closing';

export interface SettingsState {
  readonly status: SettingsStatus;
  readonly isAnimating: boolean;
  readonly openCount: number;
  readonly closeCount: number;
}

export type SettingsAction =
  | { type: 'OPEN' }
  | { type: 'OPEN_COMPLETE' }
  | { type: 'CLOSE' }
  | { type: 'CLOSE_COMPLETE' }
  | { type: 'FORCE_CLOSE' }
  | { type: 'RESET' };

export interface TransitionResult {
  readonly newState: SettingsState;
  readonly shouldSync: boolean;
  readonly isDuplicate: boolean;
  readonly isValid: boolean;
}

// ============================================================================

export class SettingsStateMachine {
  static createInitialState(): SettingsState {
    return {
      status: 'closed',
      isAnimating: false,
      openCount: 0,
      closeCount: 0,
    };
  }

  static transition(state: SettingsState, action: SettingsAction): TransitionResult {
    switch (action.type) {
      case 'OPEN':
        return this.handleOpen(state);
      case 'OPEN_COMPLETE':
        return this.handleOpenComplete(state);
      case 'CLOSE':
        return this.handleClose(state);
      case 'CLOSE_COMPLETE':
        return this.handleCloseComplete(state);
      case 'FORCE_CLOSE':
        return this.handleForceClose(state);
      case 'RESET':
        return this.handleReset();
      default:
        return {
          newState: state,
          shouldSync: false,
          isDuplicate: false,
          isValid: false,
        };
    }
  }

  private static handleOpen(state: SettingsState): TransitionResult {
    if (state.status !== 'closed') {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: true,
        isValid: false,
      };
    }

    return {
      newState: {
        ...state,
        status: 'opening',
        isAnimating: true,
      },
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }

  private static handleOpenComplete(state: SettingsState): TransitionResult {
    if (state.status !== 'opening') {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: false,
        isValid: false,
      };
    }

    const newOpenCount = state.openCount + 1;

    return {
      newState: {
        ...state,
        status: 'open',
        isAnimating: false,
        openCount: newOpenCount,
      },
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }

  private static handleClose(state: SettingsState): TransitionResult {
    if (state.status !== 'open' && state.status !== 'opening') {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: true,
        isValid: false,
      };
    }

    return {
      newState: {
        ...state,
        status: 'closing',
        isAnimating: true,
      },
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }

  private static handleCloseComplete(state: SettingsState): TransitionResult {
    if (state.status !== 'closing') {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: false,
        isValid: false,
      };
    }

    const newCloseCount = state.closeCount + 1;

    return {
      newState: {
        ...state,
        status: 'closed',
        isAnimating: false,
        closeCount: newCloseCount,
      },
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }

  private static handleForceClose(state: SettingsState): TransitionResult {
    if (state.status === 'closed' && !state.isAnimating) {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: true,
        isValid: false,
      };
    }

    return {
      newState: {
        ...state,
        status: 'closed',
        isAnimating: false,
      },
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }

  private static handleReset(): TransitionResult {
    return {
      newState: SettingsStateMachine.createInitialState(),
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }
}
