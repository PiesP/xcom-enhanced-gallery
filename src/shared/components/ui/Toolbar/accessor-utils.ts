import type { MaybeAccessor } from './Toolbar.types';

export type Accessor<T> = () => T;

const isAccessor = <T>(value: MaybeAccessor<T> | undefined): value is Accessor<T> =>
  typeof value === 'function';

const resolveAccessorValue = <T>(value: MaybeAccessor<T> | undefined): T | undefined => {
  if (isAccessor(value)) {
    return value();
  }
  return value;
};

export const toRequiredAccessor = <T>(
  resolver: () => MaybeAccessor<T> | undefined,
  fallback: T,
): Accessor<T> => {
  return () => {
    const resolved = resolveAccessorValue(resolver());
    return (resolved ?? fallback) as T;
  };
};

export const toOptionalAccessor = <T>(
  resolver: () => MaybeAccessor<T> | undefined,
): Accessor<T | undefined> => {
  return () => resolveAccessorValue(resolver());
};
