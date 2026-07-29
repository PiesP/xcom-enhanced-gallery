import { defineConfig } from 'vite';
import { extensionBackgroundConfig } from './tooling/vite/configs/extension';

export default defineConfig(extensionBackgroundConfig('chrome'));
