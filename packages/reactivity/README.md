> [!WARNING]
> This package is in active development! Expect breaking changes!

# Upcoming: Version 1!

I am proud to announce the work in progress for version 1. This version will include all necessary tools and functions for you to build a fully functional reactive framework! This version will also be having some breaking changes. Most functionality will continue to work for now but will be deprecated/change once version 1 is released.

# Reactivity

A simple lightweight reactivity library. Framework agnostic and unoppinionated.
With a very simple api this package is very lightweight and easy to use.
Just import it's methods and have reactivity anywhere! As you may notice this module does not use stores. This is because I think stores are very unnecessary as stores are simply state that's accessed globally. Also this module
does not come with a memo method. Perhaps if it's really needed I might add it in the future, so far a memo is just as simple as a function that returns a computed state value. This is also how you create derived state.

### Features

1. State anywhere! ✨
2. No store functions or complex state management!
3. No unsubscribe problems and recursive effects!
4. Simple and lightweight!
5. Platform independent works both in Nodejs and in the browser!
6. Not tied to a framework, bring your own rendering mechanism!

## Installation

You can choose your package manager of choice npm, yarn or pnpm. This command will install Version 1 and this version is not yet stable and ready for production so be cautious using this in your code! **Breaking changes** may apply while it's being developed.

**npm:**

```sh
npm i @pixelform/reactivity@next
```

**yarn:**

```sh
yarn add @pixelform/reactivity@next
```

**pnpm:**

```sh
pnpm add @pixelform/reactivity@next
```

## Breaking changes in v1

Pre v1, state was declared using a state function which created a signal. Since this naming doesn't quite make much sense there will now be a `signal` function to create signals. The state function has been repurposed to create a proxy state similar to Vue's `ref` function. You can choose which function you use, both doing pretty much the same but having different developer experiences. You can use the same effect function for both `signal` and `state` functions.

`state` function becomes `signal` function:

```diff
- import { state, effect } from '@pixelform/reactivity'
+ import { signal, effect } from '@pixelform/reactivity'

- let count = state(0)
+ let count = signal(0)

effect(() => {
    console.log(count())
})
```

The new `state` function could be used for deeply reactive objects:

```diff
import { state, effect } from '@pixelform/reactivity'

let data = state({
    count: 0
})

- data({ count: data().count + 1 })
+ data.count++

effect(() => {
-    console.log(data().count)
+    console.log(data.count)
})
```

State created with `state` is **deeply** reactive. Nested objects and arrays are
reactive too, properties added later are tracked, and array mutations trigger
effects:

```javascript
const user = state({
    details: { name: 'John Doe', age: 31 },
    tags: ['admin'],
})

effect(() => {
    console.log(user.details.age, user.tags.length)
})

user.details.age++ // re-runs the effect
user.tags.push('editor') // re-runs the effect
user.active = true // newly added properties are reactive too
```

or simple values:

```javascript
const count = state(0)

count.value += 1

effect(() => {
    console.log(count.value)

    // Can be used directly in a string too, omitting the `value` property:
    console.log(`The value of count is: ${count}`)
})
```

## Features in Version 1

Signal state is now deep merged which makes updating easier:

```javascript
const user = signal({
    details: { name: 'John Doe', age: 31 },
    preferences: { theme: 'light' },
})

user({ details: { age: 34 } })

effect(() => {
    console.log(user())
    /*
        Logs:
        {
            details: {
                name: 'John Doe',
                age: 34
            },
            preferences: {
                theme: 'light'
            }
        }
    */
})
```

Promised based reactivity:

```javascript
import { promised } from '@pixelform/reactivity'

const user = promised(Promise.resolve(5))

effect(() => {
    console.log(user.result) // 5
})
```

Derived (computed) state is **lazy** and **memoized**: it isn't computed until
first read, recomputes only when one of its reactive dependencies changes, and
is read-only:

```javascript
import { state, derived, effect } from '@pixelform/reactivity'

const count = state(1)
const double = derived(() => count.value * 2) // not computed yet

effect(() => {
    console.log(double.value) // computes once: 2
})

count.value = 5 // marks stale; double.value recomputes to 10 on next read
count.value = 5 // unchanged: cached value is reused, no recomputation
```

`promised` creates a deeply reactive state that reacts to a promise. `pending`
starts `true` and flips to `false` once the promise settles, filling `result` or
`error`. Pass a function returning a promise to make the source reactive: it
re-runs whenever its dependencies change, ignores stale results from superseded
runs (preventing race conditions), and exposes a `reload()` method:

```javascript
import { state, promised, effect } from '@pixelform/reactivity'

const query = state('a')
const search = promised(() => fetch(`/api?q=${query.value}`).then(res => res.json()))

effect(() => {
    if (search.pending) return console.log('loading…')
    if (search.error) return console.log('failed:', search.error)
    console.log(search.result) // deeply reactive once resolved
})

query.value = 'b' // triggers a new request; the stale one is ignored
search.reload() // manually re-run the source
```

`snapshot` creates a plain, non-reactive deep clone, handy for logging or
serialization. `trigger` manually re-runs the effects subscribed to a reactive
value:

```javascript
import { state, snapshot, trigger, effect } from '@pixelform/reactivity'

const data = state({ items: [1, 2, 3] })

console.log(snapshot(data)) // { items: [1, 2, 3] } (plain, not reactive)

effect(() => console.log(data.items.length))

trigger(data) // force the effect to run again
trigger(data, 'items') // only effects depending on `items`
```

## Effects

`effect` runs a function immediately and re-runs it whenever its reactive
dependencies change. Dependencies are tracked precisely on every run, so
branches that are no longer read stop triggering the effect. An effect may
return a cleanup function, which runs before each re-run and when the effect is
stopped. Calling the value returned by `effect` disposes it:

```javascript
import { signal, effect } from '@pixelform/reactivity'

const count = signal(0)

const dispose = effect(() => {
    console.log(count())
    return () => console.log('cleanup') // runs before re-run and on dispose
})

count(1) // logs: cleanup, then 1
dispose() // logs: cleanup; the effect no longer runs
```

Updates are batched: an effect runs at most once per flush even when several of
its dependencies change. Within a flush, effects run in `pre` → normal → `post`
order, mirroring Svelte 5.

```javascript
effect.pre(() => {}) // runs before normal effects in a flush
effect(() => {}) // normal effect
effect.post(() => {}) // runs after normal effects (a `tick` substitute)
```

`effect.root` creates an isolated scope. Effects created inside it are owned by
the scope instead of the surrounding effect, and are disposed together when the
provided `dispose` function is called. `effect.tracking()` reports whether code
is currently running inside a reactive context:

```javascript
import { effect } from '@pixelform/reactivity'

const dispose = effect.root(dispose => {
    effect(() => {
        /* ... */
    })
    return dispose
})

dispose() // stops every effect created inside the scope
```

You can also pass an error boundary so a throwing effect doesn't crash the
flush:

```javascript
effect(
    () => {
        throw new Error('boom')
    },
    { onError: error => console.error(error) },
)
```

`untrack`, `batch`, `flush` and `tick` give finer control over tracking and
scheduling:

```javascript
import { signal, effect, untrack, batch, tick } from '@pixelform/reactivity'

const a = signal(0)
const b = signal(0)

effect(() => {
    a() // tracked
    untrack(() => b()) // read without subscribing
})

batch(() => {
    a(1)
    b(1) // dependent effects run once, after the batch
})

await tick() // resolves once pending effects have flushed
```

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Commit your changes with a descriptive message.
4. Push your changes to your forked repository.
5. Open a pull request to the main repository.

_Please make sure to write tests for your changes and run the existing test suite with npm test before submitting your pull request._

## License

This project is licensed under the MIT License.
See the [LICENSE](https://github.com/PixelForm/hybrid/blob/main/LICENSE.md) file for more details.
