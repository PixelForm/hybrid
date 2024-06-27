import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import { readFile } from 'node:fs/promises'

const pkg = JSON.parse(await readFile('package.json'))

const minify = () => terser({
    compress: {
        ecma: 2022,
        unsafe_arrows: true,
        inline: true,
        keep_fargs: false,
        module: true,
        passes: 3
    }
})

export default [
    {
        input: 'src/index.ts',
        output: [
            { file: pkg.main, format: 'umd', name: 'Hyper' },
            { file: pkg.unpkg, format: 'umd', name: 'Hyper', plugins: [minify()] },
            { file: pkg.module, format: 'es' },
        ],
        plugins: [typescript()],
    },
]
