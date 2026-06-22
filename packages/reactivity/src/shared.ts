export type Noop = () => void

export type ReactiveObject<T> = {
    get value(): T
    set value(new_value: T)
    valueOf(): any
    toString(): string
}

/**
 * Checks two values for equality using javascript strict equal checking mode.
 * @param {any} a The first value to check.
 * @param {any} b The second value to check.
 * @returns {boolean} Returns `true` if both values are strictly equal else `false`.
 */
export function strictEqual(a: any, b: any): boolean {
    return a === b
}

/**
 * Checks whether a value is an `Object`.
 * @param {unknown} value The value to check.
 * @returns {boolean} Returns `true` if the value is an `Object` else `false`.
 */
export function isObject(value: unknown): boolean {
    return value !== null && typeof value === 'object'
}

/**
 * Checks whether a value is an `Array`.
 * @param {any} value The value to check.
 * @returns Returns `true` if the value is an `Array` else `false`.
 */
export function isArray(value: any): boolean {
    return Array.isArray(value)
}

/**
 * Checks if two arrays or strings have the same length.
 * @param {any} a The first value to check.
 * @param {any} b The second value to check.
 * @returns {boolean} Returns `true` if both arrays or strings have the same length else `false`.
 */
export function sameLength(a: any, b: any): boolean {
    return a.length === b.length
}

/**
 * Checks if the provided value is equal.
 *
 * This function performs a deep equality check for primitive values,
 * arrays, and plain objects.
 *
 * @param {any} a The first value to check.
 * @param {any} b The second value to check.
 * @returns {boolean} Returns `true` if both values are the same, `false` otherwise.
 *
 * @example
 * equal(1, 1); // true
 * equal({a: 1}, {a: 1}); // true
 * equal([1, 2, 3], [1, 2, 3]); // true
 * equal(1, '1'); // false
 */
export function equal(a: any, b: any): boolean {
    if (isArray(a) && isArray(b)) {
        if (!sameLength(a, b)) return false

        for (let i = 0; i < a.length; i++) {
            if (!equal(a[i], b[i])) return false
        }

        return true
    }

    if (isObject(a) && isObject(b)) {
        const k1 = Object.keys(a),
            k2 = Object.keys(b)

        if (!sameLength(k1, k2)) return false

        for (let i = 0; i < k1.length; i++) {
            const key = k1[i]
            if (!(key in b) || !equal(a[key], b[key])) return false
        }

        return true
    }

    return Object.is(a, b)
}

/**
 * Recursively deep merges two objects. Adds properties if they don't exist yet. If an empty object is passed as value then the value will be replaced instead of merged.
 * @param {Object} target - The target object to merge into.
 * @param {Object} source - The source object providing updates.
 * @returns {Object} - The merged object.
 */
export function merge<T>(target: T, source: Partial<T>): T {
    const result = { ...target } as Record<string, any>

    for (const key in source) {
        const value = source[key] as any

        if (value && isObject(value) && !isArray(value)) {
            if (Object.keys(value).length === 0) {
                result[key] = {}
            } else {
                result[key] = merge((target as any)[key] || {}, value)
            }
        } else {
            result[key] = value
        }
    }

    return result as T
}

/**
 * A function that performs cleanup when an effect re-runs or is stopped.
 */
export type Cleanup = () => void

/**
 * The body of an effect. It may optionally return a {@link Cleanup} function
 * that runs before the next re-run and when the effect is stopped.
 */
export type EffectFn = () => void | Cleanup

/**
 * Options that customize an effect.
 */
export interface EffectOptions {
    /** Called with any error thrown by the effect or its cleanup. */
    onError?: (error: unknown) => void
}

type Queue = 'pre' | 'normal' | 'post'

/**
 * Internal reactive node shared by effects and computed values.
 */
export interface Reaction {
    fn: EffectFn
    scheduler: Noop | null
    cleanup: Cleanup | null
    deps: Set<Set<Reaction>>
    children: Set<Reaction>
    parent: Reaction | null
    queue: Queue
    active: boolean
    running: boolean
    onError: ((error: unknown) => void) | null
}

/**
 * A set of reactions subscribed to a single reactive source.
 */
export type Subscribers = Set<Reaction>

const noop: Noop = () => {}

/** The reaction currently being tracked, if any. */
export let activeReaction: Reaction | null = null

/** Whether reads should register dependencies on the active reaction. */
let shouldTrack = true

const preQueue: Set<Reaction> = new Set()
const normalQueue: Set<Reaction> = new Set()
const postQueue: Set<Reaction> = new Set()

let flushing = false
let batchDepth = 0

const MAX_FLUSH_ITERATIONS = 100000

/**
 * Registers the active reaction as a subscriber of the provided set. NOTE: this
 * function is for internal use only!
 *
 * @param {Subscribers} subscriptions The set the active reaction should join.
 */
export function effectSetup(subscriptions: Subscribers) {
    if (activeReaction && shouldTrack) {
        subscriptions.add(activeReaction)
        activeReaction.deps.add(subscriptions)
    }
}

/**
 * Schedules every reaction in the provided set to run. Updates are batched so
 * each reaction runs at most once per flush. NOTE: this function is for internal
 * use only!
 *
 * @param {Subscribers} subscriptions The set of reactions to schedule.
 */
export function effectRunner(subscriptions: Subscribers) {
    batchDepth++
    try {
        for (const reaction of [...subscriptions]) schedule(reaction)
    } finally {
        batchDepth--
        if (batchDepth === 0 && !flushing) flush()
    }
}

function queueFor(reaction: Reaction): Set<Reaction> {
    if (reaction.queue === 'pre') return preQueue
    if (reaction.queue === 'post') return postQueue
    return normalQueue
}

function schedule(reaction: Reaction) {
    if (!reaction.active) return

    if (reaction.scheduler) {
        reaction.scheduler()
        return
    }

    queueFor(reaction).add(reaction)

    if (batchDepth === 0 && !flushing) flush()
}

function nextReaction(): Reaction | undefined {
    const queue = preQueue.size ? preQueue : normalQueue.size ? normalQueue : postQueue
    if (!queue.size) return undefined

    const reaction = queue.values().next().value as Reaction
    queue.delete(reaction)
    return reaction
}

/**
 * Synchronously runs all pending effects, in `pre` → `normal` → `post` order.
 */
export function flush() {
    if (flushing) return

    flushing = true
    let iterations = 0

    try {
        let reaction: Reaction | undefined
        while ((reaction = nextReaction())) {
            if (++iterations > MAX_FLUSH_ITERATIONS) {
                preQueue.clear()
                normalQueue.clear()
                postQueue.clear()
                throw new Error(
                    'Maximum effect update depth exceeded. This usually indicates an effect that repeatedly updates a value it depends on.',
                )
            }

            runReaction(reaction)
        }
    } finally {
        flushing = false
    }
}

function clearDeps(reaction: Reaction) {
    for (const dep of reaction.deps) dep.delete(reaction)
    reaction.deps.clear()
}

function runCleanup(reaction: Reaction) {
    if (!reaction.cleanup) return

    const cleanup = reaction.cleanup
    reaction.cleanup = null

    try {
        cleanup()
    } catch (error) {
        handleError(reaction, error)
    }
}

function disposeChildren(reaction: Reaction) {
    if (!reaction.children.size) return

    for (const child of [...reaction.children]) stop(child)
    reaction.children.clear()
}

function handleError(reaction: Reaction, error: unknown) {
    let node: Reaction | null = reaction
    while (node) {
        if (node.onError) return node.onError(error)
        node = node.parent
    }
    throw error
}

/**
 * Runs a function with the given reaction as the tracking context, clearing its
 * previous dependencies first so only the dependencies read during this run are
 * retained. NOTE: this function is for internal use only!
 */
export function withReaction<T>(reaction: Reaction, fn: () => T): T {
    clearDeps(reaction)

    const prevReaction = activeReaction
    const prevTrack = shouldTrack
    activeReaction = reaction
    shouldTrack = true
    reaction.running = true

    try {
        return fn()
    } finally {
        reaction.running = false
        activeReaction = prevReaction
        shouldTrack = prevTrack
    }
}

function runReaction(reaction: Reaction) {
    if (!reaction.active) return

    runCleanup(reaction)
    disposeChildren(reaction)

    try {
        const result = withReaction(reaction, reaction.fn) as void | Cleanup
        reaction.cleanup = typeof result === 'function' ? result : null
    } catch (error) {
        handleError(reaction, error)
    }
}

function createReaction(fn: EffectFn, queue: Queue, options?: EffectOptions): Reaction {
    const reaction: Reaction = {
        fn,
        scheduler: null,
        cleanup: null,
        deps: new Set(),
        children: new Set(),
        parent: activeReaction,
        queue,
        active: true,
        running: false,
        onError: options?.onError ?? null,
    }

    if (activeReaction) activeReaction.children.add(reaction)

    return reaction
}

/**
 * Creates a computed reaction whose scheduler runs when a dependency changes,
 * instead of re-running its body. NOTE: this function is for internal use only!
 *
 * @param {Noop} scheduler Invoked when a tracked dependency changes.
 */
export function createComputed(scheduler: Noop): Reaction {
    const reaction = createReaction(noop, 'normal')
    reaction.scheduler = scheduler
    return reaction
}

/**
 * Stops a reaction: runs its cleanup, disposes its children, removes it from its
 * dependencies and queues, and prevents it from running again.
 */
export function stop(reaction: Reaction) {
    if (!reaction.active) return

    reaction.active = false
    runCleanup(reaction)
    disposeChildren(reaction)
    clearDeps(reaction)

    if (reaction.parent) reaction.parent.children.delete(reaction)

    preQueue.delete(reaction)
    normalQueue.delete(reaction)
    postQueue.delete(reaction)
}

function createEffect(queue: Queue) {
    return (fn: EffectFn, options?: EffectOptions): Noop => {
        const reaction = createReaction(fn, queue, options)
        runReaction(reaction)
        return () => stop(reaction)
    }
}

const baseEffect = createEffect('normal')

/**
 * Runs `fn` without tracking any reactive reads inside it as dependencies.
 *
 * @template T
 * @param {() => T} fn The function to run untracked.
 * @returns {T} The return value of `fn`.
 */
export function untrack<T>(fn: () => T): T {
    const prev = shouldTrack
    shouldTrack = false
    try {
        return fn()
    } finally {
        shouldTrack = prev
    }
}

/**
 * Groups multiple reactive updates so dependent effects run only once, after the
 * callback completes.
 *
 * @template T
 * @param {() => T} fn The function performing the updates.
 * @returns {T} The return value of `fn`.
 */
export function batch<T>(fn: () => T): T {
    batchDepth++
    try {
        return fn()
    } finally {
        batchDepth--
        if (batchDepth === 0) flush()
    }
}

/**
 * Resolves after pending effects have been flushed, allowing code to run once
 * the reactive system has settled.
 *
 * @returns {Promise<void>} A promise that resolves after the next flush.
 */
export function tick(): Promise<void> {
    return Promise.resolve().then(() => flush())
}

/**
 * Creates an isolated reactive scope. Effects created inside `fn` are owned by
 * the scope rather than the surrounding effect, and are disposed when the
 * returned `dispose` function is called.
 *
 * @template T
 * @param {(dispose: Noop) => T} fn Receives the scope's dispose function.
 * @returns {T} The return value of `fn`.
 */
function root<T>(fn: (dispose: Noop) => T): T {
    const scope: Reaction = {
        fn: noop,
        scheduler: null,
        cleanup: null,
        deps: new Set(),
        children: new Set(),
        parent: null,
        queue: 'normal',
        active: true,
        running: false,
        onError: null,
    }

    const dispose: Noop = () => stop(scope)

    const prevReaction = activeReaction
    const prevTrack = shouldTrack
    activeReaction = scope
    shouldTrack = false

    try {
        return fn(dispose)
    } finally {
        activeReaction = prevReaction
        shouldTrack = prevTrack
    }
}

/**
 * Returns `true` when called within a reactive tracking context (inside an
 * effect or computed), `false` otherwise.
 */
function tracking(): boolean {
    return activeReaction !== null && shouldTrack
}

/**
 * Creates a reactive effect that runs immediately and re-runs whenever its
 * reactive dependencies change.
 *
 * The effect may return a cleanup function, which runs before each re-run and
 * when the effect is stopped. Calling the returned function disposes the effect.
 *
 * Variants:
 * - `effect.pre(fn)` runs before normal effects in a flush.
 * - `effect.post(fn)` runs after normal effects in a flush (a `tick` substitute).
 * - `effect.root(fn)` creates an isolated, manually disposed scope.
 * - `effect.tracking()` reports whether code is running inside an effect.
 *
 * @param {EffectFn} fn The function to run as a reactive effect.
 * @param {EffectOptions} [options] Optional configuration, e.g. an error handler.
 * @returns {Noop} A function that stops (disposes) the effect.
 *
 * @example
 * const count = signal(0)
 *
 * const dispose = effect(() => {
 *     console.log(count()) // runs now and whenever count changes
 *     return () => console.log('cleanup')
 * })
 *
 * count(1) // logs: cleanup, then 1
 * dispose() // logs: cleanup; stops the effect
 */
export const effect = Object.assign(baseEffect, {
    pre: createEffect('pre'),
    post: createEffect('post'),
    root,
    tracking,
})
