import {
    type Subscribers,
    createComputed,
    effectSetup,
    effectRunner,
    equal,
    withReaction,
} from './shared'
import type { WritableState } from './state'

/**
 * Creates a lazily evaluated, memoized reactive value computed from other
 * reactive sources, which can also be written to like `state`.
 *
 * The computation is **lazy**: it does not run until the value is first read.
 * It is **memoized**: the cached result is reused until one of the reactive
 * values it read changes, at which point it is marked stale and recomputed on
 * the next read. Reading the value inside an effect subscribes that effect so it
 * re-runs when the computed result changes.
 *
 * Writing `value` (or calling `set`) is a **temporary override**, exactly like
 * Svelte 5's `$derived`: it takes effect immediately, but is discarded the next
 * time a tracked dependency changes, at which point `fn` recomputes the value.
 *
 * @template T
 * @param {() => T} fn The getter function that computes the derived value.
 * @returns {WritableState<T>} A writable reactive object exposing `value`.
 *
 * @example
 * const count = state(1)
 * const double = derived(() => count.value * 2) // not computed yet
 *
 * effect(() => {
 *     console.log(double.value) // computes once: 2
 * })
 *
 * double.value = 99 // override: logs 99
 * count.value = 5 // dependency changed: override discarded, recomputes to 10
 */
export function derived<T>(fn: () => T): WritableState<T> {
    const subscriptions: Subscribers = new Set()
    let value: T
    let stale = true

    // Runs when a tracked dependency changes: marks the cache stale and notifies
    // any effects depending on this computed so they re-read and recompute.
    const reaction = createComputed(() => {
        if (!stale) {
            stale = true
            effectRunner(subscriptions)
        }
    })

    function read(): T {
        effectSetup(subscriptions)
        if (stale) {
            value = withReaction(reaction, fn)
            stale = false
        }
        return value
    }

    function write(new_value: T): void {
        if (!stale && equal(value, new_value)) return
        value = new_value
        stale = false
        effectRunner(subscriptions)
    }

    return {
        get value() {
            return read()
        },
        set value(new_value) {
            write(new_value)
        },
        set(new_value: T | ((prev: T) => T)) {
            write(
                typeof new_value === 'function' ? (new_value as (prev: T) => T)(read()) : new_value,
            )
        },
        valueOf() {
            return read()
        },
        toString() {
            return String(read())
        },
    } as WritableState<T>
}
