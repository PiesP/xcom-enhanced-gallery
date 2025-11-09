/**
 * State Machines Module
 *
 * Pure function-based state transition logic collection
 * (State Machines return new state without updates)
 */

export { NavigationStateMachine } from './navigation-state-machine';

export type {
  NavigationState,
  NavigationAction,
  NavigationTransitionResult,
} from './navigation-state-machine';
