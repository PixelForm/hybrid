import { isArray, isObject } from '../shared'
import { RAW } from './reactive'

/**
 * Creates a plain, non-reactive deep clone of a reactive value.
 *
 * Useful for logging, serialization (`JSON.stringify`) or passing data to code
 * that should not be affected by, or trigger, reactivity.
 *
 * @template T
 * @param {T} value A reactive proxy, reactive object, or plain value.
 * @returns {T} A deep clone free of reactive proxies.
 *
 * @example
 * const user = state({ details: { name: 'John' } })
 * const plain = snapshot(user) // { details: { name: 'John' } } (not reactive)
 */
export function snapshot<T>(value: T): T {
    const raw = isObject(value) ? ((value as any)[RAW] ?? value) : value

    if (isArray(raw)) {
        return (raw as any[]).map(item => snapshot(item)) as T
    }

    if (isObject(raw)) {
        const proto = Object.getPrototypeOf(raw)

        if (proto === Object.prototype || proto === null) {
            const result: Record<string, any> = {}

            for (const key of Object.keys(raw as object)) {
                result[key] = snapshot((raw as any)[key])
            }

            return result as T
        }
    }

    return raw as T
}
