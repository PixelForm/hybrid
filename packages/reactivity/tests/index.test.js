const { signal, state, effect, promised, derived, snapshot, trigger } = require('../dist/index.js')

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
