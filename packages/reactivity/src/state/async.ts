import { state } from './state'

/**
 * The shape of a reactive async state created by {@link asyncState}.
 *
 * @template T The type the promise resolves to.
 */
export interface AsyncState<T> {
    /** The resolved value, or the initial value while pending. */
    result: T | undefined
    /** The rejection reason, or `null` when there is no error. */
    error: Error | null
    /** `true` while the promise is unsettled, `false` once settled. */
    pending: boolean
}

/**
 * Creates a deeply reactive state that reacts to a promise.
 *
 * Works like {@link stateSync} but tracks the lifecycle of the provided promise.
 * `pending` starts as `true` and becomes `false` once the promise settles,
 * `result` is filled on resolve and `error` on reject. Because the returned
 * value is a deep reactive state, a resolved object `result` is itself reactive.
 *
 * @template T
 * @param {Promise<T>} promise The promise to react to.
 * @param {T} [initial] An optional initial value used while pending.
 * @returns {AsyncState<T>} The deeply reactive async state.
 *
 * @example
 * import { state } from '@pixelform/reactivity/async'
 * import { effect } from '@pixelform/reactivity'
 *
 * const user = state(fetchUser())
 *
 * effect(() => {
 *     if (user.pending) return console.log('loading…')
 *     if (user.error) return console.log('failed:', user.error)
 *     console.log(user.result)
 * })
 */
export function asyncState<T>(promise: Promise<T>, initial?: T): AsyncState<T> {
    const store = state<AsyncState<T>>({
        result: initial,
        error: null,
        pending: true,
    })

    promise
        .then(value => {
            store.result = value
        })
        .catch(error => {
            store.error = error
        })
        .finally(() => {
            store.pending = false
        })

    return store
}
