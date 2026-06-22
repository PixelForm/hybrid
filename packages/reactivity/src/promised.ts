import { effect } from './shared'
import { reactive } from './reactive'

/**
 * A source for {@link promised}: either a promise, or a function returning a
 * promise. A function source is re-invoked whenever any reactive value it reads
 * changes, making the async state react to its dependencies.
 *
 * @template T The type the promise resolves to.
 */
export type PromiseSource<T> = Promise<T> | (() => Promise<T>)

/**
 * The shape of a reactive async state created by {@link promised}.
 *
 * @template T The type the promise resolves to.
 */
export interface AsyncState<T> {
    /** The resolved value, or the initial value while pending. */
    result: T | undefined
    /** The rejection reason, or `null` when there is no error. */
    error: Error | null
    /** `true` while the current promise is unsettled, `false` once settled. */
    pending: boolean
    /** Re-runs the source, producing a fresh promise to react to. */
    reload(): void
}

/**
 * Creates a deeply reactive state that reacts to a promise.
 *
 * The source may be a promise or a function returning a promise. When a function
 * is provided it is called synchronously so the reactive values it reads are
 * tracked; the state then re-runs automatically whenever those dependencies
 * change. Stale results are discarded so only the most recent run settles the
 * state, preventing race conditions between concurrent promises.
 *
 * Because the returned value is a deep reactive state, a resolved object
 * `result` is itself reactive.
 *
 * @template T
 * @param {PromiseSource<T>} source The promise, or a function returning one.
 * @param {T} [initial] An optional initial value used before the first resolve.
 * @returns {AsyncState<T>} The deeply reactive async state.
 *
 * @example
 * // reactive source: re-fetches whenever `query.value` changes
 * const query = state('a')
 * const search = promised(() => fetch(`/api?q=${query.value}`).then(r => r.json()))
 *
 * effect(() => {
 *     if (search.pending) return console.log('loading…')
 *     if (search.error) return console.log('failed:', search.error)
 *     console.log(search.result)
 * })
 *
 * query.value = 'b' // triggers a new request; the stale one is ignored
 * search.reload()    // manually re-run the source
 */
export function promised<T>(source: PromiseSource<T>, initial?: T): AsyncState<T> {
    const factory = typeof source === 'function' ? (source as () => Promise<T>) : () => source

    const store = reactive({
        result: initial,
        error: null as Error | null,
        pending: true,
    })

    // Monotonic token used to ignore results from superseded runs so the latest
    // run is always the one that settles the state (last-call-wins).
    let version = 0

    function run() {
        const current = ++version

        store.pending = true
        store.error = null

        let promise: Promise<T>
        try {
            promise = Promise.resolve(factory())
        } catch (error) {
            store.error = error as Error
            store.pending = false
            return
        }

        promise
            .then(value => {
                if (current === version) store.result = value
            })
            .catch(error => {
                if (current === version) store.error = error as Error
            })
            .finally(() => {
                if (current === version) store.pending = false
            })
    }

    // Track the source's reactive dependencies and re-run when they change. The
    // run only reads `factory`'s dependencies (never the store's own fields), so
    // writing result/error/pending here cannot retrigger this effect.
    effect(run)

    Object.defineProperty(store, 'reload', {
        value: run,
        enumerable: false,
    })

    return store as unknown as AsyncState<T>
}
