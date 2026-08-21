const {
    state,
    effect,
    watch,
    untrack,
    batch,
    flush,
    tick,
    derived,
    stateAsync,
    derivedAsync,
    snapshot,
    trigger,
} = require('../dist/index.js')

function deferred() {
    let resolve
    let reject
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise
        reject = rejectPromise
    })
    return { promise, resolve, reject }
}

describe('state function', () => {
    test('should initialize state with a given value', () => {
        const count = state(0)
        expect(count.value).toBe(0)
    })

    test('should treat null as a valid state value', () => {
        const nullState = state(null)
        expect(nullState.value).toBe(null)
    })

    test('should treat undefined as a valid state value', () => {
        const undefinedState = state(undefined)
        expect(undefinedState.value).toBeUndefined()
    })

    test('should treat true as valid value', () => {
        const truthystate = state(true)
        expect(truthystate.value).toBeTruthy()
    })

    test('should treat false as valid value', () => {
        const falsystate = state(false)
        expect(falsystate.value).toBeFalsy()
    })

    test('should update state and notify subscribers', () => {
        const count = state(0)
        const mockEffect = jest.fn()
        effect(() => {
            mockEffect(count.value)
        })

        expect(mockEffect).toHaveBeenCalledWith(0)
        count.value += 1
        expect(mockEffect).toHaveBeenCalledWith(1)
    })

    test('should not notify subscribers if state does not change', () => {
        const count = state(0)
        const mockEffect = jest.fn()
        effect(() => {
            mockEffect(count.value)
        })

        count.value = 0
        expect(mockEffect).toHaveBeenCalledTimes(1) // Initial call only
    })

    test('should update a primitive via set with a value', () => {
        const count = state(0)
        const mockEffect = jest.fn(() => count.value)

        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)

        count.set(5)
        expect(count.value).toBe(5)
        expect(mockEffect).toHaveBeenCalledTimes(2)
    })

    test('should update a primitive via set with an updater function', () => {
        const count = state(1)

        count.set(c => c + 1)
        expect(count.value).toBe(2)

        count.set(c => c * 10)
        expect(count.value).toBe(20)
    })

    test('should merge an object via set with a value', () => {
        const user = state({ name: 'John', age: 30 })
        const mockEffect = jest.fn(() => user.age)

        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)

        user.set({ age: 31 })
        expect(user.age).toBe(31)
        expect(user.name).toBe('John')
        expect(mockEffect).toHaveBeenCalledTimes(2)
    })

    test('should update an object via set with an updater function', () => {
        const user = state({ count: 0 })

        user.set(prev => ({ count: prev.count + 1, added: true }))
        expect(user.count).toBe(1)
        expect(user.added).toBe(true)
    })
})

describe('effect with state function', () => {
    test('should run effect immediately', () => {
        const mockEffect = jest.fn()
        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)
    })

    test('should re-run effect when dependencies change', () => {
        const count = state(0)
        const mockEffect = jest.fn(() => {
            count.value
        })

        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)
        count.value = 1
        expect(mockEffect).toHaveBeenCalledTimes(2)
    })

    test('should handle nested effects correctly', () => {
        const outerEffect = jest.fn()
        const innerEffect = jest.fn()

        effect(() => {
            outerEffect()
            effect(innerEffect)
        })

        expect(outerEffect).toHaveBeenCalledTimes(1)
        expect(innerEffect).toHaveBeenCalledTimes(1)
    })

    test('should handle conditionals with state correctly', () => {
        const count = state(0)
        const testFunc = jest.fn()

        const mockEffect = jest.fn(() => {
            if (count.value >= 3) return
            testFunc()
        })

        effect(mockEffect)

        count.value += 1
        count.value += 1
        count.value += 1
        count.value += 1
        count.value += 1
        count.value += 1

        expect(testFunc).toHaveBeenCalledTimes(3)
    })
})

describe('deep reactive state', () => {
    test('should react to nested object mutations', () => {
        const data = state({ details: { age: 31 } })
        const mockEffect = jest.fn(() => data.details.age)

        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)

        data.details.age++
        expect(mockEffect).toHaveBeenCalledTimes(2)
    })

    test('should not notify when a value does not change', () => {
        const data = state({ count: 0 })
        const mockEffect = jest.fn(() => data.count)

        effect(mockEffect)
        data.count = 0
        expect(mockEffect).toHaveBeenCalledTimes(1)
    })

    test('should react to array push via length', () => {
        const data = state({ items: [1] })
        const mockEffect = jest.fn(() => data.items.length)

        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)

        data.items.push(2)
        expect(mockEffect).toHaveBeenCalledTimes(2)
        expect(data.items.length).toBe(2)
    })

    test('should react to array index assignment', () => {
        const list = state([1, 2, 3])
        const mockEffect = jest.fn(() => list[0])

        effect(mockEffect)
        list[0] = 10
        expect(mockEffect).toHaveBeenCalledTimes(2)
    })

    test('should react to newly added properties', () => {
        const data = state({})
        const mockEffect = jest.fn(() => Object.keys(data).length)

        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)

        data.added = true
        expect(mockEffect).toHaveBeenCalledTimes(2)
    })

    test('should react to deleted properties', () => {
        const data = state({ a: 1 })
        const mockEffect = jest.fn(() => Object.keys(data).length)

        effect(mockEffect)
        delete data.a
        expect(mockEffect).toHaveBeenCalledTimes(2)
    })
})

describe('derived state', () => {
    test('should compute and update from dependencies', () => {
        const count = state(1)
        const double = derived(() => count.value * 2)

        expect(double.value).toBe(2)

        const mockEffect = jest.fn(() => double.value)
        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)
        expect(double.value).toBe(2)

        count.value = 5
        expect(double.value).toBe(10)
        expect(mockEffect).toHaveBeenCalledTimes(2)
    })

    test('should be lazy and not compute until first read', () => {
        const count = state(1)
        const compute = jest.fn(() => count.value * 2)
        const double = derived(compute)

        expect(compute).not.toHaveBeenCalled()

        expect(double.value).toBe(2)
        expect(compute).toHaveBeenCalledTimes(1)
    })

    test('should memoize and only recompute when dependencies change', () => {
        const count = state(2)
        const compute = jest.fn(() => count.value * 2)
        const double = derived(compute)

        expect(double.value).toBe(4)
        expect(double.value).toBe(4)
        expect(compute).toHaveBeenCalledTimes(1) // cached

        count.value = 3
        expect(double.value).toBe(6)
        expect(compute).toHaveBeenCalledTimes(2) // recomputed once
    })

    test('should be writable, overriding the value until a dependency changes', () => {
        const count = state(2)
        const double = derived(() => count.value * 2)
        const mockEffect = jest.fn(() => double.value)
        effect(mockEffect)

        double.value = 99
        expect(double.value).toBe(99)
        expect(mockEffect).toHaveBeenCalledTimes(2)

        count.value = 3
        expect(double.value).toBe(6) // dependency change discards the override
        expect(mockEffect).toHaveBeenCalledTimes(3)
    })

    test('should update the override via set with a value or updater', () => {
        const count = state(2)
        const double = derived(() => count.value * 2)

        double.set(10)
        expect(double.value).toBe(10)

        double.set(prev => prev + 1)
        expect(double.value).toBe(11)
    })
})

describe('async state', () => {
    test('should expose resolved values through effect.async', async () => {
        const request = deferred()
        const result = stateAsync(request.promise)
        const observed = []

        effect.async(context => {
            observed.push({ ...context, value: result.value })
        })

        expect(observed.at(-1)).toEqual({ pending: true, error: null, value: undefined })

        request.resolve(5)
        await tick()

        expect(observed.at(-1)).toEqual({ pending: false, error: null, value: 5 })
    })

    test('should reject reads outside an async boundary', () => {
        const result = stateAsync(5)
        expect(() => result.value).toThrow(/effect\.async or derivedAsync/)
    })

    test('should be writable and ignore stale promise results', async () => {
        const first = deferred()
        const second = deferred()
        const result = stateAsync(first.promise)
        let value

        effect.async(() => {
            value = result.value
        })

        result.value = second.promise
        first.resolve('stale')
        second.resolve('current')
        await tick()

        expect(value).toBe('current')

        result.set(previous => `${previous}!`)
        expect(value).toBe('current!')
    })
})

describe('async derived state', () => {
    test('should propagate async dependencies without a context argument', async () => {
        const request = deferred()
        const source = stateAsync(request.promise)
        const compute = jest.fn(() => source.value * 2)
        const doubled = derivedAsync(compute)
        const quadrupled = derivedAsync(() => doubled.value * 2)
        let context
        let value

        effect.async(current => {
            context = current
            value = quadrupled.value
        })

        expect(compute.mock.calls[0]).toEqual([])
        expect(context).toEqual({ pending: true, error: null })
        expect(value).toBeUndefined()

        request.resolve(4)
        await tick()

        expect(context).toEqual({ pending: false, error: null })
        expect(value).toBe(16)
    })

    test('should aggregate pending and errors across async reads', async () => {
        const pendingRequest = deferred()
        const failedRequest = deferred()
        const pending = stateAsync(pendingRequest.promise)
        const failed = stateAsync(failedRequest.promise)
        let context

        effect.async(current => {
            context = current
            pending.value
            failed.value
        })

        const error = new Error('failed')
        failedRequest.reject(error)
        await tick()

        expect(context).toEqual({ pending: true, error })
    })

    test('should be writable, overriding the value until a dependency changes', async () => {
        const count = state(2)
        const doubled = derivedAsync(() => count.value * 2)
        let value

        effect.async(() => {
            value = doubled.value
        })
        await tick()
        expect(value).toBe(4)

        doubled.value = 99
        expect(value).toBe(99)

        count.value = 3
        await tick()
        expect(value).toBe(6) // dependency change discards the override
    })

    test('should ignore a stale in-flight recompute after an override', async () => {
        const count = state(2)
        const request = deferred()
        const doubled = derivedAsync(() => {
            count.value
            return request.promise
        })
        let value

        effect.async(() => {
            value = doubled.value
        })

        doubled.value = 'override'
        request.resolve('stale')
        await tick()

        expect(value).toBe('override')
    })

    test('should update the override via set with a value or updater', async () => {
        const doubled = derivedAsync(() => 4)
        let value

        effect.async(() => {
            value = doubled.value
        })
        await tick()

        doubled.set(10)
        expect(value).toBe(10)

        doubled.set(prev => prev + 1)
        expect(value).toBe(11)
    })
})

describe('snapshot', () => {
    test('should create a plain non-reactive deep clone', () => {
        const data = state({ details: { age: 31 }, tags: ['a'] })
        const plain = snapshot(data)

        expect(plain).toEqual({ details: { age: 31 }, tags: ['a'] })

        const mockEffect = jest.fn(() => data.details.age)
        effect(mockEffect)

        plain.details.age = 99
        expect(mockEffect).toHaveBeenCalledTimes(1)
    })
})

describe('trigger', () => {
    test('should manually re-run a specific effect', () => {
        const mockEffect = jest.fn()
        const ref = effect(mockEffect)

        expect(mockEffect).toHaveBeenCalledTimes(1)

        trigger(ref)
        expect(mockEffect).toHaveBeenCalledTimes(2)

        trigger(ref)
        expect(mockEffect).toHaveBeenCalledTimes(3)
    })

    test('should manually run a watcher', () => {
        const callback = jest.fn()
        const count = state(0)
        const ref = watch([count], callback)

        // watch does not run on creation
        expect(callback).toHaveBeenCalledTimes(0)

        trigger(ref)
        expect(callback).toHaveBeenCalledTimes(1)
    })

    test('should not run an effect after disposal', () => {
        const mockEffect = jest.fn()
        const ref = effect(mockEffect)

        ref()
        trigger(ref)
        expect(mockEffect).toHaveBeenCalledTimes(1)
    })
})

describe('watch', () => {
    test('should not run the callback on creation', () => {
        const count = state(0)
        const callback = jest.fn()

        watch([count], callback)
        expect(callback).toHaveBeenCalledTimes(0)
    })

    test('should run the callback when a primitive dependency changes', () => {
        const count = state(0)
        const callback = jest.fn()

        watch([count], callback)

        count.value = 1
        expect(callback).toHaveBeenCalledTimes(1)

        count.set(2)
        expect(callback).toHaveBeenCalledTimes(2)
    })

    test('should run the callback when an object dependency changes', () => {
        const user = state({ name: 'John' })
        const callback = jest.fn()

        watch([user], callback)

        user.name = 'Jane'
        expect(callback).toHaveBeenCalledTimes(1)
    })

    test('should react to any of multiple dependencies', () => {
        const a = state(0)
        const b = state(0)
        const callback = jest.fn()

        watch([a, b], callback)

        a.value = 1
        expect(callback).toHaveBeenCalledTimes(1)

        b.value = 1
        expect(callback).toHaveBeenCalledTimes(2)
    })

    test('should not track reactive reads inside the callback', () => {
        const dep = state(0)
        const other = state(0)
        const callback = jest.fn(() => other.value)

        watch([dep], callback)

        // changing a value only read inside the callback must not re-run it
        other.value = 1
        expect(callback).toHaveBeenCalledTimes(0)

        dep.value = 1
        expect(callback).toHaveBeenCalledTimes(1)
    })

    test('should run cleanup before re-running and on dispose', () => {
        const count = state(0)
        const cleanup = jest.fn()
        const callback = jest.fn(() => cleanup)

        const stop = watch([count], callback)

        count.value = 1
        expect(cleanup).toHaveBeenCalledTimes(0) // first callback run

        count.value = 2
        expect(cleanup).toHaveBeenCalledTimes(1) // before re-run

        stop()
        expect(cleanup).toHaveBeenCalledTimes(2) // on dispose
    })

    test('should stop reacting after disposal', () => {
        const count = state(0)
        const callback = jest.fn()

        const stop = watch([count], callback)
        count.value = 1
        expect(callback).toHaveBeenCalledTimes(1)

        stop()
        count.value = 2
        expect(callback).toHaveBeenCalledTimes(1)
    })
})

describe('effect function', () => {
    test('should run the effect immediately', () => {
        const mockEffect = jest.fn()
        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)
    })

    test('should run cleanup before re-running and on dispose', () => {
        const count = state(0)
        const cleanup = jest.fn()

        const dispose = effect(() => {
            count.value
            return cleanup
        })

        expect(cleanup).toHaveBeenCalledTimes(0)

        count.value = 1
        expect(cleanup).toHaveBeenCalledTimes(1) // before re-run

        dispose()
        expect(cleanup).toHaveBeenCalledTimes(2) // on dispose
    })

    test('should not re-run after disposal', () => {
        const count = state(0)
        const mockEffect = jest.fn(() => count.value)

        const dispose = effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)

        dispose()
        count.value = 1
        expect(mockEffect).toHaveBeenCalledTimes(1)
    })

    test('should clean up stale dependencies precisely', () => {
        const toggle = state(true)
        const a = state('a')
        const b = state('b')
        const mockEffect = jest.fn(() => (toggle.value ? a.value : b.value))

        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)

        // Currently depends on `a`, not `b`.
        b.value = 'b2'
        expect(mockEffect).toHaveBeenCalledTimes(1)

        a.value = 'a2'
        expect(mockEffect).toHaveBeenCalledTimes(2)

        // Switch dependency to `b`; `a` should no longer trigger.
        toggle.value = false
        expect(mockEffect).toHaveBeenCalledTimes(3)

        a.value = 'a3'
        expect(mockEffect).toHaveBeenCalledTimes(3)

        b.value = 'b3'
        expect(mockEffect).toHaveBeenCalledTimes(4)
    })

    test('should throw on an unbounded update loop', () => {
        const count = state(0)
        expect(() => {
            effect(() => {
                count.value = count.value + 1
            })
        }).toThrow(/Maximum effect update depth/)
    })

    test('should terminate a bounded self-updating effect', () => {
        const count = state(0)
        expect(() => {
            effect(() => {
                if (count.value < 3) count.value = count.value + 1
            })
        }).not.toThrow()
        expect(count.value).toBe(3)
    })

    test('should run pre, normal and post effects in order', () => {
        const dep = state(0)
        const order = []

        effect.pre(() => {
            dep.value
            order.push('pre')
        })
        effect(() => {
            dep.value
            order.push('normal')
        })
        effect.post(() => {
            dep.value
            order.push('post')
        })

        order.length = 0
        dep.value = 1
        expect(order).toEqual(['pre', 'normal', 'post'])
    })

    test('should report tracking context', () => {
        expect(effect.tracking()).toBe(false)

        let inside = null
        const dispose = effect(() => {
            inside = effect.tracking()
        })

        expect(inside).toBe(true)
        expect(effect.tracking()).toBe(false)
        dispose()
    })

    test('should isolate effects in a root scope and dispose them', () => {
        const count = state(0)
        const mockEffect = jest.fn(() => count.value)

        let dispose
        effect.root(stop => {
            effect(mockEffect)
            dispose = stop
        })

        expect(mockEffect).toHaveBeenCalledTimes(1)

        count.value = 1
        expect(mockEffect).toHaveBeenCalledTimes(2)

        dispose()
        count.value = 2
        expect(mockEffect).toHaveBeenCalledTimes(2)
    })

    test('should not subscribe to reads inside untrack', () => {
        const count = state(0)
        const mockEffect = jest.fn(() => untrack(() => count.value))

        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)

        count.value = 1
        expect(mockEffect).toHaveBeenCalledTimes(1)
    })

    test('should route errors to an onError boundary', () => {
        const count = state(0)
        const onError = jest.fn()

        effect(
            () => {
                if (count.value === 1) throw new Error('boom')
            },
            { onError },
        )

        expect(onError).not.toHaveBeenCalled()
        count.value = 1
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
    })

    test('should run dependent effects once per batch', () => {
        const a = state(0)
        const b = state(0)
        const mockEffect = jest.fn(() => {
            a.value
            b.value
        })

        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)

        batch(() => {
            a.value = 1
            b.value = 1
        })
        expect(mockEffect).toHaveBeenCalledTimes(2)
    })

    test('should flush pending effects via tick', async () => {
        const count = state(0)
        const mockEffect = jest.fn(() => count.value)

        effect(mockEffect)
        await tick()
        expect(mockEffect).toHaveBeenCalledTimes(1)
    })
})
