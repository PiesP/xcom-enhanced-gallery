import { analyzeStyleTokens } from '../src/dev-scripts/styleTokenAnalyzer.mjs';

const result = await analyzeStyleTokens({
  definitionRoots: [
    'src/shared/styles/design-tokens.css',
    'src/shared/styles/design-tokens-solid.css',
  ],
  componentFiles: [
    'src/features/settings/components/SettingsOverlay.module.css',
    'src/shared/components/ui/Toolbar/Toolbar.module.css',
  ],
});

console.log('Defined tokens:', result.definedTokens.size);
console.log('Referenced tokens count:', result.referencedTokens.size);
console.log('Contains --xeg-modal-bg-hover ?', result.referencedTokens.has('--xeg-modal-bg-hover'));
console.log('Missing tokens:', Array.from(result.missingTokens).slice(0, 20));
