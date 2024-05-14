import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import { readFile } from 'node:fs/promises'

const pkg = JSON.parse(await readFile('package.json'))

export default [
	{
		input: 'src/index.js',
		output: {
			name: 'hyper',
			file: pkg.browser,
			format: 'iife',
		},
		plugins: [resolve(), terser({ compress: { passes: 2 } })],
	},
	{
		input: 'src/index.js',
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' },
		],
	},
]
