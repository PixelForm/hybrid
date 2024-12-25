const { signal, state, effect, promised } = require('../dist/index.js')

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
    test('promise should resolve', async () => {
        const { result, pending } = promised(
            new Promise((resolve) => {
                resolve('result')
            }),
        )

        effect(() => {
            if (pending()) return
            expect(result()).toBe('result')
        })
    })
})
