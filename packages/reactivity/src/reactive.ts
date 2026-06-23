import {
    type Subscribers,
    batch,
    effectSetup,
    effectRunner,
    equal,
    isArray,
    isObject,
} from './shared'

/**
 * Sentinel dependency key used to track iteration based reads such as
 * `Object.keys`, `for…in`, spreads and array `length`/iteration.
 */
export const ITERATE_KEY = Symbol('iterate')

/**
 * Special property used to retrieve the raw, unproxied target that backs a
 * reactive proxy. Reading `proxy[RAW]` never registers a dependency.
 */
export const RAW = Symbol('raw')

type DepsMap = Map<PropertyKey, Subscribers>

const targetMap = new WeakMap<object, DepsMap>()
const proxyCache = new WeakMap<object, any>()
const setterCache = new WeakMap<object, (value: any) => void>()

/**
 * Checks whether a value can be turned into a deep reactive proxy. Only plain
 * objects and arrays are proxied; built-ins like `Date`, `Map` or class
 * instances are returned untouched to avoid breaking their internals.
 */
function canReactive(value: any): boolean {
    if (isArray(value)) return true
    if (!isObject(value)) return false
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
}

function unwrap<T>(value: T): T {
    return isObject(value) ? (value as any)[RAW] ?? value : value
}

function getSubscriptions(target: object, key: PropertyKey): Subscribers {
    let deps = targetMap.get(target)
    if (!deps) targetMap.set(target, (deps = new Map()))

    let subscriptions = deps.get(key)
    if (!subscriptions) deps.set(key, (subscriptions = new Set()))

    return subscriptions
}

/**
 * Registers the currently running effect as a dependency of `target[key]`.
 * NOTE: this function is for internal use only!
 */
export function track(target: object, key: PropertyKey) {
    effectSetup(getSubscriptions(target, key))
}

/**
 * Runs every effect that depends on `target[key]`.
 * NOTE: this function is for internal use only!
 */
export function notify(target: object, key: PropertyKey) {
    const subscriptions = targetMap.get(target)?.get(key)
    if (subscriptions) effectRunner(subscriptions)
}

/**
 * Creates a deeply reactive proxy for the provided object or array.
 *
 * Nested objects and arrays are wrapped lazily on access, properties added
 * later become reactive, and array mutations (`push`, index assignment,
 * `length`) trigger effects.
 *
 * @template T
 * @param {T} target The object or array to make reactive.
 * @returns {T} The reactive proxy, or the original value if it cannot be proxied.
 */
export function reactive<T extends object>(target: T): T {
    if (!canReactive(target)) return target

    const existing = proxyCache.get(target)
    if (existing) return existing

    const proxy = new Proxy(target, {
        get(obj, key, receiver) {
            if (key === RAW) return obj

            // Expose a `set` method that merges a value or updater result into
            // the reactive object in a single batched update, unless the object
            // already defines its own `set` property.
            if (key === 'set' && !Reflect.has(obj, key)) {
                let setter = setterCache.get(obj)
                if (!setter) {
                    setter = (value: any) => {
                        const next = typeof value === 'function' ? value(receiver) : value
                        batch(() => Object.assign(receiver, next))
                    }
                    setterCache.set(obj, setter)
                }
                return setter
            }

            const result = Reflect.get(obj, key, receiver)

            if (typeof key === 'symbol') return result

            track(obj, key)

            return canReactive(result) ? reactive(result as object) : result
        },
        set(obj, key, value, receiver) {
            const had = Object.prototype.hasOwnProperty.call(obj, key)
            const old = (obj as any)[key]
            const next = unwrap(value)
            const result = Reflect.set(obj, key, next, receiver)

            if (!had) {
                notify(obj, key)
                notify(obj, ITERATE_KEY)
                if (isArray(obj)) notify(obj, 'length')
            } else if (!equal(old, next)) {
                notify(obj, key)
                if (isArray(obj) && key === 'length') notify(obj, ITERATE_KEY)
            }

            return result
        },
        deleteProperty(obj, key) {
            const had = Object.prototype.hasOwnProperty.call(obj, key)
            const result = Reflect.deleteProperty(obj, key)

            if (had && result) {
                notify(obj, key)
                notify(obj, ITERATE_KEY)
            }

            return result
        },
        has(obj, key) {
            if (typeof key !== 'symbol') track(obj, ITERATE_KEY)
            return Reflect.has(obj, key)
        },
        ownKeys(obj) {
            track(obj, ITERATE_KEY)
            return Reflect.ownKeys(obj)
        },
    })

    proxyCache.set(target, proxy)

    return proxy
}
