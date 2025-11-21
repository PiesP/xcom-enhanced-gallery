const STYLE_ELEMENT_ID = 'xeg-styles';
const ERROR_EVENT_NAME = 'xeg:style-injection-error';

const DEV_ERROR_REPORTER = [
  "    var detail = e instanceof Error",
  "      ? { message: e.message, stack: e.stack || '' }",
  "      : { message: String(e) };",
  "    var target = typeof window !== 'undefined'",
  "      ? window",
  "      : (typeof globalThis !== 'undefined' ? globalThis : null);",
  "    if (target && typeof target.dispatchEvent === 'function') {",
  "      var eventInstance;",
  "      if (typeof CustomEvent === 'function') {",
  `        eventInstance = new CustomEvent('${ERROR_EVENT_NAME}', { detail: detail });`,
  "      } else if (typeof document !== 'undefined' && typeof document.createEvent === 'function') {",
  "        eventInstance = document.createEvent('CustomEvent');",
  `        eventInstance.initCustomEvent('${ERROR_EVENT_NAME}', false, false, detail);`,
  "      }",
  "      if (eventInstance) {",
  "        target.dispatchEvent(eventInstance);",
  "      }",
  "    }",
].join('\n');

const PROD_ERROR_REPORTER = [
  "var d=e instanceof Error?{message:e.message,stack:e.stack||''}:{message:String(e)},",
  "t=typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null;",
  "if(t&&typeof t.dispatchEvent==='function'){",
  "var n;",
  "if(typeof CustomEvent==='function'){",
  `n=new CustomEvent('${ERROR_EVENT_NAME}',{detail:d});`,
  "}else if(typeof document!=='undefined'&&typeof document.createEvent==='function'){",
  "n=document.createEvent('CustomEvent');",
  `n.initCustomEvent('${ERROR_EVENT_NAME}',false,false,d);`,
  "}",
  "if(n){t.dispatchEvent(n);}",
  "}",
].join('');

/**
 * Build-time helper that generates a self-invoking style injection snippet.
 * @param css Collected CSS output from Vite build.
 * @param isDev Whether the build is for development (pretty output) or production (minified output).
 */
export function createStyleInjector(css: string, isDev: boolean = false): string {
  if (!css.trim()) {
    return '';
  }

  const serializedCss = JSON.stringify(css);

  if (isDev) {
    return `(function() {
  try {
    var s = document.getElementById('${STYLE_ELEMENT_ID}');
    if (s) s.remove();
    s = document.createElement('style');
    s.id = '${STYLE_ELEMENT_ID}';
    s.textContent = ${serializedCss};
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {
${DEV_ERROR_REPORTER}
  }
})();`;
  }

  return (
    `(function(){` +
    `try{` +
    `var s=document.getElementById('${STYLE_ELEMENT_ID}');` +
    `if(s) s.remove();` +
    `s=document.createElement('style');` +
    `s.id='${STYLE_ELEMENT_ID}';` +
    `s.textContent=${serializedCss};` +
    `(document.head||document.documentElement).appendChild(s);` +
    `}catch(e){${PROD_ERROR_REPORTER}}` +
    `})();`
  );
}
