import { type ReactiveObject, effect } from '../shared'
import { reactive } from './reactive'

/**
 * Creates a read-only reactive value computed from other reactive sources.
 *
 * The provided function is re-run automatically whenever any reactive value it
 * reads changes, and reading the derived value inside an effect subscribes that
 * effect to the result.
 *
 * @template T
 * @param {() => T} fn The function that computes the derived value.
 * @returns {ReactiveObject<T>} A read-only reactive object exposing `value`.
 *
 * @example
 * const count = state(1)
 * const double = derived(() => count.value * 2)
 *
 * effect(() => {
 *     console.log(double.value) // 2, then re-runs when count changes
 * })
 *
 * count.value = 5 // double.value becomes 10
 */
export function derived<T>(fn: () => T): ReactiveObject<T> {
    const store = reactive({ value: undefined as T })

    effect(() => {
        store.value = fn()
    })

    return store as unknown as ReactiveObject<T>
}
