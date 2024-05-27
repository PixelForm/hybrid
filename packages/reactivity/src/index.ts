import { equal } from './equal'

let context = []

export function state(value) {
	const subscriptions = new Set()

	function invalidate(new_value) {
		if (!new_value) {
			const effect = context[context.length - 1]
			if (effect) subscriptions.add(effect)
			return value
		}

		if (typeof new_value === 'function') {
			new_value = new_value(value)
		}

		if (equal(value, new_value)) return

		value = new_value

		for (const subscription of [...subscriptions]) {
			subscription()
		}
	}

	return invalidate
}

export function effect(fn) {
	;(function run() {
		context.push(run)
		try {
			fn()
		} finally {
			context.pop()
		}
	})()
}
