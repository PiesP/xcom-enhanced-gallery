import { defineConfig } from 'vite';
import { extensionContentConfig } from './tooling/vite/configs/extension.ts';

// Content scripts must remain classic IIFEs; the shared factory enforces this at bundle time.
export default defineConfig(extensionContentConfig('chrome'));
