import { getPreactHooks } from '@shared/external/vendors';

export interface FocusScopeApi<T extends HTMLElement = HTMLElement> {
  readonly ref: { current: T | null };
}

export function useFocusScope<T extends HTMLElement = HTMLElement>(): FocusScopeApi<T> {
  const { useRef } = getPreactHooks();
  const ref = useRef<T | null>(null);
  return { ref } as const;
}

export default useFocusScope;
