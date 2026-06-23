import { type ReactiveObject, equal, isObject } from './shared'
import { reactive, track, notify } from './reactive'

/**
 * A deeply reactive object or array, extended with a `set` method for replacing
 * or merging its contents in a single update.
 */
export type ReactiveState<T> = T & {
    set(value: Partial<T> | ((prev: T) => Partial<T>)): void
}

/**
 * A reactive wrapper around a primitive value. Read and write its `value`, or
 * use `set` to update it from a value or an updater function.
 */
export type WritableState<T> = ReactiveObject<T> & {
    set(value: T | ((prev: T) => T)): void
}

/**
 * Creates a reactive state.
 *
 * If the input is an object or array it is turned into a **deeply** reactive
 * proxy: nested values are reactive, properties added later are tracked, and
 * array mutations trigger effects. Read and mutate it like a normal object.
 *
 * If the input is a primitive, a reactive object with a `value` property is
 * returned instead. Reading and writing `value` participates in reactivity, and
 * `valueOf`/`toString` allow it to be used directly in expressions.
 *
 * Both forms expose a `set` method that accepts either a new value or an updater
 * function receiving the current value.
 *
 * @template T The type of the value to be made reactive.
 * @param value The initial value of the reactive state.
 * @returns The reactive state.
 *
 * @example
 * // deep object state
 * const user = state({ details: { name: 'John', age: 31 } })
 *
 * effect(() => {
 *     console.log(user.details.age) // re-runs whenever it changes
 * })
 *
 * user.details.age++
 * user.set({ details: { age: 32 } }) // merge update
 *
 * @example
 * // primitive state
 * const count = state(0)
 *
 * count.value += 1
 * count.set(c => c + 1)
 *
 * effect(() => {
 *     console.log(count.value) // 2
 *     console.log(`count is: ${count}`) // uses toString
 * })
 */
export function state<T extends object>(value: T): ReactiveState<T>
export function state<T>(value: T): WritableState<T>
export function state<T>(value: T): ReactiveState<T> | WritableState<T> {
    if (isObject(value)) {
        return reactive(value as object) as ReactiveState<T>
    }

    const ref = {
        get value() {
            track(ref, 'value')
            return value
        },
        set value(new_value) {
            if (equal(value, new_value)) return
            value = new_value
            notify(ref, 'value')
        },
        set(new_value: T | ((prev: T) => T)) {
            ref.value =
                typeof new_value === 'function' ? (new_value as (prev: T) => T)(value) : new_value
        },
        valueOf() {
            return value
        },
        toString() {
            return String(value)
        },
    } as WritableState<T>

    return ref
}
