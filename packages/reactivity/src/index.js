import { equal } from './equal'

/**
 * @typedef {import('./index.d').EffectFunction} EffectFunction
 * @typedef {import('./index.d').Stack} Stack
 */

/** @type {Stack} */
let stack = []

/**
 * Creates a signal like state and returns a function which can both be used as getter and setter. Call the returned function to get the value and pass an argument to set the new state.
 * @template T
 * @param {T} value The value to set as initial value for the state.
 */
export function state(value) {
    const subscriptions = new Set()

    /**
     * @param {T | ((value: T) => T)} new_value The new value to set as state. If this parameter is omitted or the odl and new values are the same then the current value is returned. The new value can be any value or a function with it's parameter being the previous state. Updating the old state will then trigger any effects if available.
     * @returns {T | undefined} The new value or the old value if either new value was not provided or the values are the same.
     */
    function invalidate(new_value) {
        if (!new_value) {
            const effect = stack[stack.length - 1]
            if (effect) subscriptions.add(effect)
            return value
        }

        if (typeof new_value === 'function') {
            // @ts-ignore
            new_value = new_value(value)
        }

        if (equal(value, new_value)) return value

        // @ts-ignore - Here value should be safe to set
        value = new_value

        for (const subscription of [...subscriptions]) {
            subscription()
        }
    }

    return invalidate
}

/**
 * Creates an effect and runs the provided function whenever the state it depends on changes.
 * @param {EffectFunction} fn The function to run when state changes. You can call any state getters inside this function to provide these states as dependencies.
 */
export function effect(fn) {
    ;(function run() {
        stack.push(run)
        try {
            fn()
        } finally {
            stack.pop()
        }
    })()
}
