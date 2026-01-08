import type { LanguageStrings } from './i18n.types';

export const TRANSLATION_VALUE_COUNT = 39 as const;

export function buildLanguageStringsFromValues(values: ReadonlyArray<string>): LanguageStrings {
  if (__DEV__ && values.length !== TRANSLATION_VALUE_COUNT) {
    throw new Error(
      `Invalid translation value count: expected ${TRANSLATION_VALUE_COUNT}, got ${values.length}`
    );
  }

  let i = 0;
  const next = (): string => values[i++]!;

  const built: LanguageStrings = {
    tb: {
      prev: next(),
      next: next(),
      dl: next(),
      dlAllCt: next(),
      setOpen: next(),
      cls: next(),
      twTxt: next(),
      twPanel: next(),
      twUrl: next(),
      fitOri: next(),
      fitW: next(),
      fitH: next(),
      fitC: next(),
    },
    st: {
      th: next(),
      lang: next(),
      thAuto: next(),
      thLt: next(),
      thDk: next(),
      langAuto: next(),
      langKo: next(),
      langEn: next(),
      langJa: next(),
    },
    msg: {
      err: {
        t: next(),
        b: next(),
      },
      kb: {
        t: next(),
        prev: next(),
        next: next(),
        cls: next(),
        toggle: next(),
      },
      dl: {
        one: {
          err: {
            t: next(),
            b: next(),
          },
        },
        allFail: {
          t: next(),
          b: next(),
        },
        part: {
          t: next(),
          b: next(),
        },
      },
      gal: {
        emptyT: next(),
        emptyD: next(),
        itemLbl: next(),
        loadFail: next(),
      },
    },
  };

  // Shallow-freeze to prevent accidental mutation of the translation registry objects.
  return Object.freeze(built) as LanguageStrings;
}
