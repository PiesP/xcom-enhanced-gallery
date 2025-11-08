/**
 * State Machines Module
 *
 * Pure function-based state transition logic collection
 * (State Machines return new state without updates)
 */

export {
  NavigationStateMachine,
  type NavigationState,
  type NavigationAction,
  type TransitionResult as NavigationTransitionResult,
} from './navigation-state-machine';

export {
  DownloadStateMachine,
  type DownloadState as MachineDownloadState,
  type DownloadStatus as MachineDownloadStatus,
  type DownloadAction as MachineDownloadAction,
  type TransitionResult as DownloadTransitionResult,
} from './download-state-machine';

export {
  SettingsStateMachine,
  type SettingsState,
  type SettingsStatus,
  type SettingsAction,
  type TransitionResult as SettingsTransitionResult,
} from './settings-state-machine';

export {
  ToastStateMachine,
  type ToastState,
  type ToastStatus,
  type ToastItem,
  type ToastAction,
  type TransitionResult as ToastTransitionResult,
} from './toast-state-machine';
