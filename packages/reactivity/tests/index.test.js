const {
    state,
    effect,
    watch,
    untrack,
    batch,
    flush,
    tick,
    derived,
    snapshot,
    trigger,
} = require('../dist/index.js')

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
