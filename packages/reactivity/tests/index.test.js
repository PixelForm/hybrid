const { equal, state, effect } = require('../dist/index.js')

describe('equal function', () => {
    test('should return true for equal primitive values', () => {
        expect(equal(1, 1)).toBe(true)
        expect(equal('test', 'test')).toBe(true)
        expect(equal(true, true)).toBe(true)
    })

    test('should return false for non-equal primitive values', () => {
        expect(equal(1, 2)).toBe(false)
        expect(equal('test', 'Test')).toBe(false)
        expect(equal(true, false)).toBe(false)
    })

    test('should return true for equal objects and arrays', () => {
        expect(equal({ a: 1 }, { a: 1 })).toBe(true)
        expect(equal([1, 2, 3], [1, 2, 3])).toBe(true)
    })

    test('should return false for non-equal objects and arrays', () => {
        expect(equal({ a: 1 }, { a: 2 })).toBe(false)
        expect(equal([1, 2, 3], [1, 2, 4])).toBe(false)
    })

    test('should handle NaN values correctly', () => {
        expect(equal(NaN, NaN)).toBe(true)
    })
})

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
