type Noop = () => void

let stack: Noop[] = []

/**
 * Checks if the provided values are equal.
 * @param {any} a The first value to check.
 * @param {any} b The second value to check.
 * @returns {boolean} Returns true if both values are the same and false otherwise.
 */
export function equal(a: any, b: any): boolean {
    const self = equal

    if (a === b || (a !== a && b !== b)) {
        return true
    }

    if (a == null || b == null || typeof a !== typeof b) {
        return false
    }

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false
        }
        for (let i = 0; i < a.length; i++) {
            if (!self(a[i], b[i])) {
                return false
            }
        }
        return true
    }

    if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a)
        const keysB = Object.keys(b)

        if (keysA.length !== keysB.length) {
            return false
        }

        for (let i = 0; i < keysA.length; i++) {
            const key = keysA[i]
            if (!keysB.includes(key) || !self(a[key], b[key])) {
                return false
            }
        }
        return true
    }

    return a === b
}

export function state<T>(value: T): <U extends T>(new_value: U) => T | undefined {
    const subscriptions: Set<Noop> = new Set()

    function invalidate<U extends T>(new_value: U): T | undefined {
        if (!new_value) {
            const effect = stack[stack.length - 1]
            if (effect) subscriptions.add(effect)
            return value
        }

        if (typeof new_value === 'function') {
            new_value = new_value(value)
        }

        if (equal(value, new_value)) return value

        value = new_value

        for (const subscription of [...subscriptions]) {
            subscription()
        }
    }

    return invalidate
}

export function effect(fn: Noop) {
    ;(function run() {
        stack.push(run)
        try {
            fn()
        } finally {
            stack.pop()
        }
    })()
}
