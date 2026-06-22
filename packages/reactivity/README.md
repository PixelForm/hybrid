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

const { result, pending, error } = promised(Promise.resolve(5))

effect(() => {
    console.log(result()) // 5
})
```

Derived (computed) state recomputes automatically when its reactive
dependencies change and is read-only:

```javascript
import { state, derived, effect } from '@pixelform/reactivity'

const count = state(1)
const double = derived(() => count.value * 2)

effect(() => {
    console.log(double.value) // 2, then re-runs when count changes
})

count.value = 5 // double.value becomes 10
```

Async state is deeply reactive and reacts to a promise. `pending` starts `true`
and flips to `false` once the promise settles, filling `result` or `error`:

```javascript
import { asyncState, effect } from '@pixelform/reactivity'

const user = asyncState(fetch('/api/user').then(res => res.json()))

effect(() => {
    if (user.pending) return console.log('loading…')
    if (user.error) return console.log('failed:', user.error)
    console.log(user.result) // deeply reactive once resolved
})
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
