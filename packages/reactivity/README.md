# Reactivity

A simple lightweight reactivity library. Framework agnostic and unoppinionated.
With a very simple api this package is very lightweight and easy to use.
Just import it's methods and have reactivity anywhere! As you may notice this module does not use stores. This is because I think stores are very unnecessary as stores are simply state that's accessed globally. Also this module
does not come with a memo method. Perhaps if it's really needed I might add it in the future, so far a memo is just as simple as a function that returns a computed state value. This is also how you create derived state.

### Roadmap
1. Drop in solutions for modern frameworks: React, Vue, Svelte. (other javascript frameworks on request)
2. Drop in solutions for PHP and C# .NET (other frameworks on request)
3. State/Store library
4. Proxy based state for enhanced developer experience.
5. Smarter state protocol for checking what actually changed and returning those values.

### Features

1. State anywhere! ✨
2. No stores or complex state management
3. No unsubscribe problems and recursive effects
4. Simple and lightweight
5. Platform/Framework independent, run in NodeJs, Browser, PHP, C# .NET etc
6. No rendering library! (Bring your very own like jQuery or vanilla javascript)

## Installation

```sh
npm install @pixelform/reactivity
```

Or:

```sh
pnpm add @pixelform/reactivity
```

## Basic usage

```javascript
import { state, effect } from '@pixelform/reactivity'

const count = state(0)

count(count => count + 1)
// or
count(count() + 1)

effect(() => {
    console.log(count())
})
```

### Derived state/memo/computed values

```javascript
import { state, effect } from '@pixelform/reactivity'

const count = state(0)
const doubled = () => count() * 2

count(count => count + 1)

effect(() => {
    console.log(count()) // logs 1
    console.log(doubled()) // logs 2
})
```

### Global state access (store like)

For example export your state:

```javascript
import { state, effect } from '@pixelform/reactivity'

export const count = state(0)
```

And import it where you need it:

```javascript
import { count } from './stores'

effect(() => {
    console.log(count()) // logs 0
})
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
