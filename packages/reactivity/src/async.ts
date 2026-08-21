import { reactive } from './reactive'
import {
    AsyncSource,
    createComputed,
    effectRunner,
    isObject,
    registerAsyncRead,
    withAsyncBoundary,
    withReaction,
} from './shared'

export type AsyncInput<T> = T | PromiseLike<T>

export interface AsyncState<T> {
    get value(): T | undefined
    set value(source: AsyncInput<T> | undefined)
    set(source: AsyncInput<T> | ((previous: T | undefined) => AsyncInput<T>)): void
    valueOf(): T | undefined
    toString(): string
}

export interface ReadonlyAsyncState<T> {
    readonly value: T | undefined
    valueOf(): T | undefined
    toString(): string
}

function isPromiseLike<T>(value: AsyncInput<T>): value is PromiseLike<T> {
    return (
        value !== null &&
        (typeof value === 'object' || typeof value === 'function') &&
        typeof (value as PromiseLike<T>).then === 'function'
    )
}

function reactiveValue<T>(value: T): T {
    return isObject(value) ? (reactive(value as object) as T) : value
}

function createSource(): AsyncSource {
    return {
        status: 'pending',
        error: null,
        subscriptions: new Set(),
    }
}

export function stateAsync<T>(source: AsyncInput<T>): AsyncState<T> {
    const asyncSource = createSource()
    let value: T | undefined
    let version = 0

    function update(next: AsyncInput<T>): void {
        const current = ++version

        if (!isPromiseLike(next)) {
            value = reactiveValue(next)
            asyncSource.status = 'resolved'
            asyncSource.error = null
            effectRunner(asyncSource.subscriptions)
            return
        }

        value = undefined
        asyncSource.status = 'pending'
        asyncSource.error = null
        effectRunner(asyncSource.subscriptions)

        Promise.resolve(next).then(
            result => {
                if (current !== version) return
                value = reactiveValue(result)
                asyncSource.status = 'resolved'
                effectRunner(asyncSource.subscriptions)
            },
            error => {
                if (current !== version) return
                asyncSource.error = error
                asyncSource.status = 'rejected'
                effectRunner(asyncSource.subscriptions)
            },
        )
    }

    const state = {
        set(next: AsyncInput<T> | ((previous: T | undefined) => AsyncInput<T>)) {
            if (typeof next === 'function') {
                const updater = next as (previous: T | undefined) => AsyncInput<T>
                update(updater(value))
            } else {
                update(next as AsyncInput<T>)
            }
        },
        valueOf() {
            return state.value
        },
        toString() {
            return String(state.value)
        },
    } as AsyncState<T>

    Object.defineProperty(state, 'value', {
        get(): T | undefined {
            registerAsyncRead(asyncSource)
            return asyncSource.status === 'resolved' ? value : undefined
        },
        set(next: AsyncInput<T> | undefined) {
            update(next as AsyncInput<T>)
        },
        enumerable: true,
    })

    update(source)
    return state
}

export function derivedAsync<T>(fn: () => AsyncInput<T>): AsyncState<T> {
    const asyncSource = createSource()
    let value: T | undefined
    let stale = true
    let version = 0

    const reaction = createComputed(() => {
        if (stale) return
        stale = true
        version++
        asyncSource.status = 'pending'
        asyncSource.error = null
        effectRunner(asyncSource.subscriptions)
    })

    function evaluate(): void {
        const current = ++version
        const boundary = { sources: new Set<AsyncSource>() }
        let result: AsyncInput<T>

        try {
            result = withReaction(reaction, () => withAsyncBoundary(boundary, fn))
        } catch (error) {
            asyncSource.status = 'rejected'
            asyncSource.error = error
            stale = false
            return
        }

        for (const source of boundary.sources) {
            if (source.status === 'rejected') {
                asyncSource.status = 'rejected'
                asyncSource.error = source.error
                stale = false
                return
            }
        }

        for (const source of boundary.sources) {
            if (source.status === 'pending') {
                asyncSource.status = 'pending'
                asyncSource.error = null
                stale = false
                return
            }
        }

        if (!isPromiseLike(result)) {
            value = reactiveValue(result)
            asyncSource.status = 'resolved'
            asyncSource.error = null
            stale = false
            return
        }

        asyncSource.status = 'pending'
        asyncSource.error = null
        stale = false

        Promise.resolve(result).then(
            resolved => {
                if (current !== version) return
                value = reactiveValue(resolved)
                asyncSource.status = 'resolved'
                effectRunner(asyncSource.subscriptions)
            },
            error => {
                if (current !== version) return
                asyncSource.error = error
                asyncSource.status = 'rejected'
                effectRunner(asyncSource.subscriptions)
            },
        )
    }

    function read(): T | undefined {
        registerAsyncRead(asyncSource)
        if (stale) evaluate()
        return asyncSource.status === 'resolved' ? value : undefined
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
    }
}
