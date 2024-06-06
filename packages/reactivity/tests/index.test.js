const { state, effect } = require('../dist/index.js')

describe('state function', () => {
    test('should initialize state with a given value', () => {
        const count = state(0)
        expect(count()).toBe(0)
    })

    test('should update state and notify subscribers', () => {
        const count = state(0)
        const mockEffect = jest.fn()
        effect(() => {
            mockEffect(count())
        })

        expect(mockEffect).toHaveBeenCalledWith(0)
        count(1)
        expect(mockEffect).toHaveBeenCalledWith(1)
    })

    test('should not notify subscribers if state does not change', () => {
        const count = state(0)
        const mockEffect = jest.fn()
        effect(() => {
            mockEffect(count())
        })

        count(0)
        expect(mockEffect).toHaveBeenCalledTimes(1) // Initial call only
    })
})

describe('effect function', () => {
    test('should run effect immediately', () => {
        const mockEffect = jest.fn()
        effect(mockEffect)
        expect(mockEffect).toHaveBeenCalledTimes(1)
    })

    test('should re-run effect when dependencies change', () => {
        const count = state(0)
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
})
