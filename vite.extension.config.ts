import { defineConfig } from 'vite';
import { extensionBackgroundConfig } from './tooling/vite/configs/extension.ts';

export default defineConfig(extensionBackgroundConfig('chrome'));
