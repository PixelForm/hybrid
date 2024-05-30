import typescript from '@rollup/plugin-typescript'
import { dts } from 'rollup-plugin-dts'
import terser from '@rollup/plugin-terser'
import { readFile } from 'node:fs/promises'

const pkg = JSON.parse(await readFile('package.json'))

export default [
	{
		input: 'src/index.js',
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' },
		],
		plugins: [typescript({ tsconfig: 'jsconfig.json' }), terser()],
	},
	{
		input: 'src/index.d.ts',
		output: { file: pkg.types, format: 'es' },
		plugins: [dts()],
	},
]
