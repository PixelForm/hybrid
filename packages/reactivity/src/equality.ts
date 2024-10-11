
/**
 * Checks two values for equality using javascript strict equal checking mode.
 * @param {any} a The first value to check.
 * @param {any} b The second value to check.
 * @returns {boolean} Returns `true` if both values are strictly equal else `false`.
 */
export function strict_equal(a: any, b: any): boolean {
    return a === b
}

/**
 * Checks whether a value is an `Object`.
 * @param {any} value The value to check.
 * @returns Returns `true` if the value is an `Object` else `false`.
 */
export function is_object(value: any): boolean {
    return value !== null && typeof value === 'object'
}

/**
 * Checks whether a value is an `Array`.
 * @param {any} value The value to check.
 * @returns Returns `true` if the value is an `Array` else `false`.
 */
export function is_array(value: any): boolean {
    return Array.isArray(value)
}

/**
 * Checks if two arrays or strings have the same length.
 * @param {any} a The first value to check.
 * @param {any} b The second value to check.
 * @returns {boolean} Returns `true` if both arrays or strings have the same length else `false`.
 */
export function same_length(a: any, b: any): boolean {
    return a.length === b.length
}

/**
 * Checks if two values result in truthy values.
 * @param {any} a The first value to check.
 * @param {any} b The second value to check.
 * @returns {boolean} Returns `true` if both values are not `null` or the same type else `false`.
 */
export function truthy(a: any, b: any): boolean {
    return a !== null || b !== null || typeof a === typeof b
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
            return key in b || equal(a[key], b[key])
        }
    }

    return strict_equal(a, b) && truthy(a, b)
}
