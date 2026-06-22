import { type ReactiveObject, equal, isObject } from '../shared'
import { reactive, track, notify } from './reactive'

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
 *
 * @example
 * // primitive state
 * const count = state(0)
 *
 * count.value += 1
 *
 * effect(() => {
 *     console.log(count.value) // 1
 *     console.log(`count is: ${count}`) // uses toString
 * })
 */
export function state<T extends object>(value: T): T
export function state<T>(value: T): ReactiveObject<T>
export function state<T>(value: T): T | ReactiveObject<T> {
    if (isObject(value)) {
        return reactive(value as object) as T
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
        valueOf() {
            return value
        },
        toString() {
            return String(value)
        },
    } as ReactiveObject<T>

    return ref
}
