/**
 * @fileoverview Pattern utilities
 * @description Common design pattern implementations
 */

export {
  createSingleton,
  createResettableSingleton,
  type SingletonInstance,
} from "./singleton";

export {
  Observable,
  ValueObservable,
  type Listener,
  type Unsubscribe,
} from "./observable";
