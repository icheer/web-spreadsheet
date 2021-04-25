import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import sveltePreprocess from 'svelte-preprocess';
import alias from '@rollup/plugin-alias';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';
import path from 'path';

const name = pkg.name
  .replace(/^(@\S+\/)?(svelte-)?(\S+)/, '$3')
  .replace(/^\w/, m => m.toUpperCase())
  .replace(/-\w/g, m => m[1].toUpperCase());

export default {
  input: 'src/index.js',
  output: [
    { file: pkg.module, format: 'es' },
    { file: pkg.main, format: 'umd', name }
  ],
  plugins: [
    svelte({
      customElement: true,
      preprocess: sveltePreprocess()
    }),
    resolve({
      browser: true
    }),
    alias({
      resolve: ['.js'],
      entries: [
        {
          find: '@',
          replacement: path.resolve(__dirname, 'src')
        },
        {
          find: '_',
          replacement: path.resolve(__dirname, 'src', 'components')
        }
      ]
    }),
    terser()
  ]
};
