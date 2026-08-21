# Reactivity

`@pixelform/reactivity` provides reactive state, derived values, effects, and
watchers for JavaScript and TypeScript applications.

## Installation

```bash
pnpm add @pixelform/reactivity
```

## Usage

```javascript
import { state, derived, effect, watch } from '@pixelform/reactivity'

const count = state(0)
const doubled = derived(() => count.value * 2)

const stopEffect = effect(() => {
    console.log(`Count: ${count.value}, doubled: ${doubled.value}`)
})

const stopWatching = watch([count], () => {
    console.log('Count changed')
})

count.value = 2
count.set(value => value + 1)

stopEffect()
stopWatching()
```

`state` also supports deeply reactive objects and arrays. Additional exports
include `stateAsync`, `derivedAsync`, `snapshot`, and utilities such as
`batch`, `flush`, `tick`, `trigger`, and `untrack`.

## Contributing

From this directory, install dependencies and run the checks with:

```bash
pnpm install
pnpm run build
pnpm test
pnpm run lint
```

Run `pnpm run format` to apply the repository's Prettier formatting. Build the
package before running tests after changing source files: the Jest tests load
the compiled `dist/index.js` output rather than the TypeScript source.
