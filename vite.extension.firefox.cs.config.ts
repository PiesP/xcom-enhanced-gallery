import { defineConfig } from 'vite';
import { extensionContentConfig } from './tooling/vite/configs/extension.ts';

// Firefox also uses a classic content script; the shared factory guards the output format.
export default defineConfig(extensionContentConfig('firefox'));
