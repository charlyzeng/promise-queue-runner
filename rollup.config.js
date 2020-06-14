import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import { main, module } from './package.json';

export default {
  input: './lib/runner.ts',
  output: [
    {
      format: 'cjs',
      file: main
    },
    {
      format: 'esm',
      file: module
    }
  ],

  plugins: [
    resolve({
      extensions: ['.ts', '.js']
    }),
    babel({
      babelHelpers: 'bundled',
      extensions: ['.ts']
    })
  ]
};
