import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// import dts from 'vite-plugin-dts';

const projectRoot = dirname(fileURLToPath(import.meta.url));

const env = loadEnv(process.env.NODE_ENV || 'development', projectRoot);

export default defineConfig({
  plugins: [
    react(),
    // dts({
    //   entryRoot: 'src',
    //   insertTypesEntry: true,
    //   include: ['src']
    // })
  ],
  base: '/Json-explorer/',
  server: {
    host: '0.0.0.0',
    port: Number(env.VITE_PORT) || 5173
  },
  build: {
    // lib: {
    //   entry: 'src/index.ts',
    //   name: 'ExplorerUI',
    //   fileName: (format) => `explorer-ui.${format === 'es' ? 'js' : 'cjs'}`,
    //   formats: ['es', 'cjs'],
    //   cssFileName: 'style'
    // },
    // rollupOptions: {
    //   external: ['react', 'react-dom', 'react/jsx-runtime'],
    //   output: {
    //     globals: {
    //       react: 'React',
    //       'react-dom': 'ReactDOM'
    //     }
    //   }
    // }
  },
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  }
});
