import { type Noop, type ReactiveObject, stack, effectSetup, effectRunner } from '../shared'

/**
 * Creates a read-only, lazily evaluated and memoized reactive value computed
 * from other reactive sources.
 *
 * The computation is **lazy**: it does not run until the value is first read.
 * It is **memoized**: the cached result is reused until one of the reactive
 * values it read changes, at which point it is marked stale and recomputed on
 * the next read. Reading the value inside an effect subscribes that effect so it
 * re-runs when the computed result changes.
 *
 * @template T
 * @param {() => T} fn The getter function that computes the derived value.
 * @returns {ReactiveObject<T>} A read-only reactive object exposing `value`.
 *
 * @example
 * const count = state(1)
 * const double = derived(() => count.value * 2) // not computed yet
 *
 * effect(() => {
 *     console.log(double.value) // computes once: 2
 * })
 *
 * count.value = 5 // marks stale; double.value recomputes to 10 on next read
 * count.value = 5 // unchanged: cached value is reused, no recomputation
 */
export function derived<T>(fn: () => T): ReactiveObject<T> {
    const subscriptions: Set<Noop> = new Set()
    let value: T
    let stale = true

    // Runs when a tracked dependency changes: marks the cache stale and notifies
    // any effects depending on this computed so they re-read and recompute.
    function scheduler() {
        if (!stale) {
            stale = true
            effectRunner(subscriptions)
        }
    }

    function compute() {
        stack.push(scheduler)
        try {
            value = fn()
            stale = false
        } finally {
            stack.pop()
        }
    }

    function read(): T {
        effectSetup(subscriptions)
        if (stale) compute()
        return value
    }

    return {
        get value() {
            return read()
        },
        valueOf() {
            return read()
        },
        toString() {
            return String(read())
        },
    } as ReactiveObject<T>
}
