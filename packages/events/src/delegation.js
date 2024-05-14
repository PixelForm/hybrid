let events = new Set()
let actions = new Map()

function attributename(attribute, eventname) {
	return attribute.name === `on:${eventname}`
}

export function listen(node, event, handler) {
	node.addEventListener(event, handler)
	return () => node.removeEventListener(event, handler)
}

export function delegate(types) {
	types.map(type => events.add(type))
}

export function register(name, handler) {
	let action = {
		name,
		handlers: [handler],
	}

	if (actions.has(name)) {
		action = actions.get(name)
		action.handlers.push(handler)
	}

	actions.set(name, action)
}

export function unregister(name, handler) {
	if (!actions.has(name)) return

	const action = actions.get(name)
	action.handlers = action.handlers.filter(fn => fn !== handler)
	actions.set(name, action)
}

export function remove(name) {
	if (!actions.has(name)) return
	actions.delete(name)
}

export function list() {
	let obj = {}

	for (let [name, action] of [...actions]) {
		obj[name] = action
	}

	return obj
}

export function bind(element = document) {
	for (let eventname of [...events]) {
		listen(element, eventname, function (event) {
			const target = event.target
			const attr = [...target.attributes].find(attribute => attributename(attribute, eventname))

			if (!attr) return

			if (actions.has(attr.value)) {
				const action = actions.get(attr.value)
				for (let handler of action.handlers) handler(event)
			}
		})
	}
}
