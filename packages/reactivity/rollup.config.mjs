import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import { readFile } from 'node:fs/promises'

const pkg = JSON.parse(await readFile('package.json'))

export default [
    {
        input: 'src/index.ts',
        output: [
            { file: pkg.main, format: 'cjs', sourcemap: true },
            { file: pkg.module, format: 'es', sourcemap: true },
        ],
        plugins: [
            typescript(),
            terser({
                compress: {
                    passes: 3,
                    module: true,
                    arguments: true,
                    keep_fargs: false,
                    unsafe_arrows: true,
                },
            }),
        ],
    },
]
