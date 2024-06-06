import typescript from '@rollup/plugin-typescript'
import { readFile } from 'node:fs/promises'

const pkg = JSON.parse(await readFile('package.json'))

export default [
    {
        input: 'src/index.ts',
        output: [
            { file: pkg.main, format: 'cjs' },
            { file: pkg.module, format: 'es' },
        ],
        plugins: [typescript()],
    },
]
