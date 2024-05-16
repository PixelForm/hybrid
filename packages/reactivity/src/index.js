let context = []

export function state(value) {
	const subscriptions = new Set()

	function invalidate(new_value) {
		if (!new_value) {
			const _effect_ = context[context.length - 1]
			if (_effect_) subscriptions.add(_effect_)
			return value
		}

		if (typeof new_value === 'function') {
			value = new_value(value)
		} else {
			value = new_value
		}

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
