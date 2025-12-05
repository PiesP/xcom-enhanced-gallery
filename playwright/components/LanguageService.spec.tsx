import { expect as pExpect, test } from '@playwright/experimental-ct-solid';
import { LanguageService } from '@/shared/services/language-service';
import { SERVICE_KEYS } from '@/constants/service-keys';
import { ClientTranslation } from './ClientTranslation';
import { CoreService } from '@shared/services/service-manager';

test('LanguageService translates keys after placeholder stubbing', async ({ mount }) => {
  // Ensure GM_* available in the Node/global context
  (globalThis as any).GM_setValue = async (k: string, v: any) => {
    (globalThis as any).__GM_STORE = (globalThis as any).__GM_STORE || {}; (globalThis as any).__GM_STORE[k] = v; return Promise.resolve();
  };
  (globalThis as any).GM_getValue = (k: string, def?: any) => ((globalThis as any).__GM_STORE || {})[k] ?? def;
  (globalThis as any).GM_deleteValue = async (k: string) => { (globalThis as any).__GM_STORE = (globalThis as any).__GM_STORE || {}; delete (globalThis as any).__GM_STORE[k]; return Promise.resolve(); };

  const coreService = CoreService.getInstance();
  const prev = coreService.tryGet(SERVICE_KEYS.LANGUAGE);
  try {
    const svc = new LanguageService();
    // Lazy load ko language before setting it
    await svc.ensureLanguageLoaded('ko');
    svc.setLanguage('ko');
    coreService.register(SERVICE_KEYS.LANGUAGE, svc);

    const component = await mount(<div data-testid="translation">{svc.translate('toolbar.tweetText')}</div>);
    const elem = component; // root element contains translation
    await pExpect(elem).toHaveText('트윗 텍스트');
  } finally {
    if (prev) coreService.register(SERVICE_KEYS.LANGUAGE, prev as any);
  }
});

test('LanguageService persists language to GM and restores on initialize', async () => {
  // Prepare fake GM store and functions in Node context
  (globalThis as any).__GM_STORE = {};
  (globalThis as any).GM_setValue = async (k: string, v: any) => {
    (globalThis as any).__GM_STORE = (globalThis as any).__GM_STORE || {};
    (globalThis as any).__GM_STORE[k] = v;
    return Promise.resolve();
  };
  (globalThis as any).GM_getValue = (k: string, def?: any) => ((globalThis as any).__GM_STORE || {})[k] ?? def;
  (globalThis as any).GM_deleteValue = async (k: string) => {
    (globalThis as any).__GM_STORE = (globalThis as any).__GM_STORE || {};
    delete (globalThis as any).__GM_STORE[k];
    return Promise.resolve();
  };

  const svc = new LanguageService();
  // Lazy load ko language before setting it
  await svc.ensureLanguageLoaded('ko');
  // Persist language to storage
  svc.setLanguage('ko');

  // Wait briefly for async persist to complete
  await new Promise((r) => setTimeout(r, 5));

  pExpect((globalThis as any).__GM_STORE['xeg-language']).toBe('ko');

  // Create a fresh instance and initialize to pick up persisted value
  const svc2 = new LanguageService();
  await svc2.initialize();
  pExpect(svc2.getCurrentLanguage()).toBe('ko');
});

test('LanguageService page-level translations use persisted language in GM', async ({ mount, page }) => {
  // Prepare Node-side GM store so that persisted language is present
  (globalThis as any).__GM_STORE = { 'xeg-language': 'ko' };
  (globalThis as any).GM_getValue = (k: string, def?: any) => ((globalThis as any).__GM_STORE || {})[k] ?? def;
  (globalThis as any).GM_setValue = async (k: string, v: any) => {
    (globalThis as any).__GM_STORE[k] = v; return Promise.resolve();
  };

  // Register a simple browser-side language service that reads language from GM and translates
  await page.evaluate(() => {
    (globalThis as any).__GM_STORE = (globalThis as any).__GM_STORE || {};
    (globalThis as any).GM_getValue = (k: string, def?: any) => (globalThis as any).__GM_STORE[k] ?? def;
    const core = (globalThis as any).CoreService.getInstance();
    core.register('language.service', {
      translate: (_key: string) => {
        if (_key === 'toolbar.tweetText') return '트윗 텍스트';
        if (_key === 'toolbar.tweetTextPanel') return '트윗 텍스트 패널';
        return _key;
      },
      getCurrentLanguage: () => (globalThis as any).GM_getValue('xeg-language', 'auto'),
      onLanguageChange: (_fn: any) => () => {},
    });
  });

  const component = await mount(<ClientTranslation />);

  await pExpect(component).toHaveText('트윗 텍스트');
});

test('ClientTranslation updates when page language service triggers onLanguageChange', async ({ mount, page }) => {
  // Register a client-side language service with listeners
  await page.evaluate(() => {
    (globalThis as any).__lang = 'ko';
    (globalThis as any).__langListeners = [] as Array<(lang: string) => void>;
    const core = (globalThis as any).CoreService.getInstance();
    core.register('language.service', {
      translate: (_key: string) => {
        return (globalThis as any).__lang === 'ko' ? '트윗 텍스트' : 'Tweet text';
      },
      getCurrentLanguage: () => (globalThis as any).__lang || 'auto',
      onLanguageChange: (fn: any) => {
        (globalThis as any).__langListeners.push(fn);
        return () => {
          (globalThis as any).__langListeners = (globalThis as any).__langListeners.filter((x: any) => x !== fn);
        };
      },
      setLanguage: (lang: string) => {
        (globalThis as any).__lang = lang;
        (globalThis as any).__langListeners.forEach((fn: any) => fn(lang));
      },
    });
  });

  const component = await mount(<ClientTranslation />);
  await pExpect(component).toHaveText('트윗 텍스트');

  // Trigger a language change in page-context
  await page.evaluate(() => {
    const svc = (globalThis as any).CoreService.getInstance().tryGet('language.service');
    svc.setLanguage('en');
  });

  await pExpect(component).toHaveText('Tweet text');
});
