# Reactivity

A simple lightweight reactivity library. Framework agnostic and unoppinionated.
With a very simple api this package is very lightweight and easy to use.
Just import it's methods and have reactivity anywhere! As you may notice this module does not use stores. This is because I think stores are very unnecessary as stores are simply state that's accessed globally. Also this module
does not come with a memo method. Perhaps if it's really needed I might add it in the future, so far a memo is just as simple as a function that returns a computed state value. This is also how you create derived state.

## Features
1. State anywhere! ✨
2. No stores or complex state management
3. No unsubscribe problems and recursive effects
4. Simple and lightweight

## Installation
```
npm install @pixelform/reactivity
```

### Basic usage
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
    console.log(count()) // logs 0 and then 1
    console.log(doubled()) // logs 0 and then 2
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

## TODO

- Add better equality checking
- Testing
- Benchmarking
- Typescript