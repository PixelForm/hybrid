/**
 * @license
 * Copyright (c) 2024 Leander de Mooij
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

type Noop = () => void

let stack: Noop[] = []

/**
 * Checks if the provided values are equal.
 *
 * This function performs a deep equality check for primitive values,
 * arrays, and plain objects.
 *
 * @param {any} a The first value to check.
 * @param {any} b The second value to check.
 * @returns {boolean} Returns true if both values are the same, false otherwise.
 *
 * @example
 * equal(1, 1); // true
 * equal({a: 1}, {a: 1}); // true
 * equal([1, 2, 3], [1, 2, 3]); // true
 * equal(1, '1'); // false
 */
function equal(a: any, b: any): boolean {
    const self = equal

    if (a === b || (a !== a && b !== b)) {
        return true
    }

    if (a == null || b == null || typeof a !== typeof b) {
        return false
    }

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false
        }
        for (let i = 0; i < a.length; i++) {
            if (!self(a[i], b[i])) {
                return false
            }
        }
        return true
    }

    if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a)
        const keysB = Object.keys(b)

        if (keysA.length !== keysB.length) {
            return false
        }

        for (let i = 0; i < keysA.length; i++) {
            const key = keysA[i]
            if (!keysB.includes(key) || !self(a[key], b[key])) {
                return false
            }
        }
        return true
    }

    return a === b
}

/**
 * Creates a signal-like state function that allows subscribing to changes and
 * invalidates when the state is updated.
 *
 * @template T
 * @param {T} value The initial state value.
 * @returns {<U extends T>(new_value: U) => T | undefined} A function to update the state.
 *
 * @example
 * const count = state(0);
 *
 * console.log(count()); // 0
 *
 * count(count => count + 1)
 * // or
 * count(count() + 1)
 *
 * console.log(count()); // 1
 */
export function state<T>(value: T): <U extends T>(new_value: U) => T | undefined {
    const subscriptions: Set<Noop> = new Set()

    function invalidate<U extends T>(new_value: U): T | undefined {
        if (!new_value) {
            const effect = stack[stack.length - 1]
            if (effect) subscriptions.add(effect)
            return value
        }

        if (typeof new_value === 'function') {
            new_value = new_value(value)
        }

        if (equal(value, new_value)) return value

        value = new_value

        for (const subscription of [...subscriptions]) {
            subscription()
        }
    }

    return invalidate
}

/**
 * Creates a reactive effect that runs whenever its dependencies change.
 *
 * @param {Noop} fn The function to run as a reactive effect.
 *
 * @example
 * let count = state(0);
 * effect(() => {
 *     console.log(count()); // runs whenever counter changes
 * });
 * counter(1); // Logs: 1
 */
export function effect(fn: Noop) {
    ;(function run() {
        stack.push(run)
        try {
            fn()
        } finally {
            stack.pop()
        }
    })()
}
