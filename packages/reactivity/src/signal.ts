import { type Noop, equal, effectSetup, effectRunner, isObject, merge } from './shared'

/**
 * Creates a signal that allows subscribing to changes and
 * invalidates when the state is updated.
 *
 * @template T
 * @param {T} value The initial state value.
 * @returns {<U extends T>(new_value: U) => T | undefined} A function to update the state.
 *
 * @example
 * const count = signal(0);
 *
 * console.log(count()); // 0
 *
 * count(count => count + 1);
 * // or
 * count(count() + 1);
 *
 * effect(() => {
 *     console.log(count()); // 1
 * });
 *
 * // merges state if it's an object
 * const data = signal({
 *     nested: {
 *         value: 0,
 *         otherValue: 'Something else'
 *     }
 * })
 *
 * data({ nested: { value: 10 } })
 *
 * effect(() => {
 *     console.log(data()) // { nested: { value: 10, otherValue: 'Something else' } }
 * })
 */
export function signal<T>(value: T): <U extends T>(new_value?: U) => T | undefined {
    const subscriptions: Set<Noop> = new Set()

    function invalidate<U extends T>(new_value?: U): T | undefined {
        if (arguments.length < 1) {
            effectSetup(subscriptions)
            return value
        }

        if (typeof new_value === 'function') {
            new_value = (new_value as (prev: T) => U)(value)
        }

        const next =
            isObject(value) && isObject(new_value)
                ? merge(value, new_value as Partial<U>)
                : (new_value as T)

        if (equal(value, next)) return value

        value = next

        effectRunner(subscriptions)

        return value
    }

    return invalidate
}
