/**
 * State Machines Module
 *
 * 순수 함수 기반의 상태 전환 로직 모음
 * (State Machines는 업데이트 없이 새로운 상태만 반환)
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
