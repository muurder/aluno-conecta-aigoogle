import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';

const removeCrossoriginPlugin = {
  name: 'remove-crossorigin-from-scripts',
  writeBundle() {
    const htmlPath = path.resolve(__dirname, 'dist/index.html');
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf-8');
      html = html.replace(/\s+crossorigin(?:="anonymous")?/gi, '');
      fs.writeFileSync(htmlPath, html);
    }
  }
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      build: {
        modulePreload: false
      },
      plugins: [removeCrossoriginPlugin, tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
