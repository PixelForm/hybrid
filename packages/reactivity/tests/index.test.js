const {
    signal,
    state,
    effect,
    untrack,
    batch,
    flush,
    tick,
    promised,
    derived,
    snapshot,
    trigger,
} = require('../dist/index.js')

describe('signal function', () => {
    test('should initialize signal with a given value', () => {
        const count = signal(0)
        expect(count()).toBe(0)
    })

    test('should treat null as a valid signal value', () => {
        const nullState = signal(null)
        expect(nullState()).toBe(null)
    })

    test('should treat undefined as a valid signal value', () => {
        const undefinedState = signal(undefined)
        expect(undefinedState()).toBeUndefined()
    })

    test('should treat true as valid signal value', () => {
        const truthystate = signal(true)
        expect(truthystate()).toBeTruthy()
    })

    test('should treat false as valid signal value', () => {
        const falsystate = signal(false)
        expect(falsystate()).toBeFalsy()
    })

    test('should update signal and notify subscribers', () => {
        const count = signal(0)
        const mockEffect = jest.fn()
        effect(() => {
            mockEffect(count())
        })

        expect(mockEffect).toHaveBeenCalledWith(0)
        count(1)
        expect(mockEffect).toHaveBeenCalledWith(1)
    })

    test('should not notify subscribers if signal does not change', () => {
        const count = signal(0)
        const mockEffect = jest.fn()
        effect(() => {
            mockEffect(count())
        })

        count(0)
        expect(mockEffect).toHaveBeenCalledTimes(1) // Initial call only
    })
})

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
})

describe('effect with signal function', () => {
    test('should run effect immediately', () => {
        const mockEffect = jest.fn()
        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)
    })

    test('should re-run effect when dependencies change', () => {
        const count = signal(0)
        const mockEffect = jest.fn(() => {
            count()
        })

        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)
        count(1)
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
        const count = signal(0)
        const testFunc = jest.fn()

        const mockEffect = jest.fn(() => {
            if (count() >= 3) return
            testFunc()
        })

        effect(mockEffect)

        count(count() + 1)
        count(count() + 1)
        count(count() + 1)
        count(count() + 1)
        count(count() + 1)
        count(count() + 1)

        expect(testFunc).toHaveBeenCalledTimes(3)
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

describe('promised based reactivity', () => {
    test('should resolve into result and clear pending', async () => {
        const store = promised(Promise.resolve('result'))

        expect(store.pending).toBe(true)

        await new Promise(resolve => setTimeout(resolve, 0))

        expect(store.pending).toBe(false)
        expect(store.error).toBe(null)
        expect(store.result).toBe('result')
    })

    test('should capture rejection in error', async () => {
        const failure = new Error('boom')
        const store = promised(Promise.reject(failure))

        await new Promise(resolve => setTimeout(resolve, 0))

        expect(store.pending).toBe(false)
        expect(store.error).toBe(failure)
    })

    test('resolved object result should be deeply reactive', async () => {
        const store = promised(Promise.resolve({ count: 0 }))

        await new Promise(resolve => setTimeout(resolve, 0))

        const mockEffect = jest.fn(() => store.result.count)
        effect(mockEffect)

        store.result.count++
        expect(mockEffect).toHaveBeenCalledTimes(2)
    })

    test('should re-run when a reactive source dependency changes', async () => {
        const id = state(1)
        const factory = jest.fn(() => Promise.resolve(id.value * 10))
        const store = promised(() => factory())

        await new Promise(resolve => setTimeout(resolve, 0))
        expect(factory).toHaveBeenCalledTimes(1)
        expect(store.result).toBe(10)

        id.value = 2
        await new Promise(resolve => setTimeout(resolve, 0))
        expect(factory).toHaveBeenCalledTimes(2)
        expect(store.result).toBe(20)
    })

    test('should ignore stale results from superseded runs (race)', async () => {
        let resolveFirst
        const first = new Promise(resolve => (resolveFirst = resolve))
        const second = Promise.resolve('second')
        const sources = [() => first, () => second]
        let call = 0

        const store = promised(() => sources[call++]())

        // trigger a second run before the first settles
        store.reload()
        await new Promise(resolve => setTimeout(resolve, 0))
        expect(store.result).toBe('second')

        // the stale first promise resolves last but must be ignored
        resolveFirst('first')
        await new Promise(resolve => setTimeout(resolve, 0))
        expect(store.result).toBe('second')
    })

    test('reload should re-run the source', async () => {
        const factory = jest.fn(() => Promise.resolve('value'))
        const store = promised(() => factory())

        await new Promise(resolve => setTimeout(resolve, 0))
        expect(factory).toHaveBeenCalledTimes(1)

        store.reload()
        await new Promise(resolve => setTimeout(resolve, 0))
        expect(factory).toHaveBeenCalledTimes(2)
    })

    test('should not re-run when result/error/pending change', async () => {
        const factory = jest.fn(() => Promise.resolve('value'))
        promised(() => factory())

        await new Promise(resolve => setTimeout(resolve, 0))
        await new Promise(resolve => setTimeout(resolve, 0))

        // settling sets result/pending; this must not loop into another run
        expect(factory).toHaveBeenCalledTimes(1)
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
    test('should manually re-run subscribers', () => {
        const data = state({ value: 1 })
        const mockEffect = jest.fn(() => data.value)

        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)

        trigger(data)
        expect(mockEffect).toHaveBeenCalledTimes(2)

        trigger(data, 'value')
        expect(mockEffect).toHaveBeenCalledTimes(3)
    })
})

describe('effect function', () => {
    test('should run the effect immediately', () => {
        const mockEffect = jest.fn()
        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)
    })

    test('should run cleanup before re-running and on dispose', () => {
        const count = signal(0)
        const cleanup = jest.fn()

        const dispose = effect(() => {
            count()
            return cleanup
        })

        expect(cleanup).toHaveBeenCalledTimes(0)

        count(1)
        expect(cleanup).toHaveBeenCalledTimes(1) // before re-run

        dispose()
        expect(cleanup).toHaveBeenCalledTimes(2) // on dispose
    })

    test('should not re-run after disposal', () => {
        const count = signal(0)
        const mockEffect = jest.fn(() => count())

        const dispose = effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)

        dispose()
        count(1)
        expect(mockEffect).toHaveBeenCalledTimes(1)
    })

    test('should clean up stale dependencies precisely', () => {
        const toggle = signal(true)
        const a = signal('a')
        const b = signal('b')
        const mockEffect = jest.fn(() => (toggle() ? a() : b()))

        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)

        // Currently depends on `a`, not `b`.
        b('b2')
        expect(mockEffect).toHaveBeenCalledTimes(1)

        a('a2')
        expect(mockEffect).toHaveBeenCalledTimes(2)

        // Switch dependency to `b`; `a` should no longer trigger.
        toggle(false)
        expect(mockEffect).toHaveBeenCalledTimes(3)

        a('a3')
        expect(mockEffect).toHaveBeenCalledTimes(3)

        b('b3')
        expect(mockEffect).toHaveBeenCalledTimes(4)
    })

    test('should throw on an unbounded update loop', () => {
        const count = signal(0)
        expect(() => {
            effect(() => {
                count(count() + 1)
            })
        }).toThrow(/Maximum effect update depth/)
    })

    test('should terminate a bounded self-updating effect', () => {
        const count = signal(0)
        expect(() => {
            effect(() => {
                if (count() < 3) count(count() + 1)
            })
        }).not.toThrow()
        expect(count()).toBe(3)
    })

    test('should run pre, normal and post effects in order', () => {
        const trigger = signal(0)
        const order = []

        effect.pre(() => {
            trigger()
            order.push('pre')
        })
        effect(() => {
            trigger()
            order.push('normal')
        })
        effect.post(() => {
            trigger()
            order.push('post')
        })

        order.length = 0
        trigger(1)
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
        const count = signal(0)
        const mockEffect = jest.fn(() => count())

        let dispose
        effect.root(stop => {
            effect(mockEffect)
            dispose = stop
        })

        expect(mockEffect).toHaveBeenCalledTimes(1)

        count(1)
        expect(mockEffect).toHaveBeenCalledTimes(2)

        dispose()
        count(2)
        expect(mockEffect).toHaveBeenCalledTimes(2)
    })

    test('should not subscribe to reads inside untrack', () => {
        const count = signal(0)
        const mockEffect = jest.fn(() => untrack(() => count()))

        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)

        count(1)
        expect(mockEffect).toHaveBeenCalledTimes(1)
    })

    test('should route errors to an onError boundary', () => {
        const count = signal(0)
        const onError = jest.fn()

        effect(
            () => {
                if (count() === 1) throw new Error('boom')
            },
            { onError },
        )

        expect(onError).not.toHaveBeenCalled()
        count(1)
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
    })

    test('should run dependent effects once per batch', () => {
        const a = signal(0)
        const b = signal(0)
        const mockEffect = jest.fn(() => {
            a()
            b()
        })

        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)

        batch(() => {
            a(1)
            b(1)
        })
        expect(mockEffect).toHaveBeenCalledTimes(2)
    })

    test('should flush pending effects via tick', async () => {
        const count = signal(0)
        const mockEffect = jest.fn(() => count())

        effect(mockEffect)
        await tick()
        expect(mockEffect).toHaveBeenCalledTimes(1)
    })
})
