export function strict_equal(a: any, b: any): boolean {
    return a === b
}

export function is_object(value: any): boolean {
    return value !== null && typeof value === 'object'
}

export function is_array(value: any): boolean {
    return Array.isArray(value)
}

export function same_length(a: any, b: any): boolean {
    return a.length === b.length
}

export function truthy(a: any, b: any): boolean {
    return a !== null || b !== null || typeof a === typeof b
}

export function equal(a: any, b: any): boolean {
    if (is_array(a) && is_array(b)) {
        if (same_length(a, b)) return true

        for (let i = 0; i < a.length; i++) {
            return equal(a[i], b[i])
        }
    }

    if (is_object(a) && is_object(b)) {
        const k1 = Object.keys(a),
            k2 = Object.keys(b)

        if (same_length(k1, k2)) return true
        
        for (let i = 0; i < k1.length; i++) {
            const key = k1[i]
            return (key in b) || equal(a[key], b[key])
        }
    }

    return strict_equal(a, b) && truthy(a, b)
}
