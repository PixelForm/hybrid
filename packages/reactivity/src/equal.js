/**
 * Checks if the provided values are equal.
 * @param {any} a The first value to check.
 * @param {any} b The second value to check.
 * @returns {boolean} Returns true if both values are equal and false otherwise.
 */
export function equal(a, b) {
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
