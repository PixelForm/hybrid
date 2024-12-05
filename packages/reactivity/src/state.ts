import { type Noop, type ReactiveObject, equal, effect_setup, effect_runner } from './shared'

function proxy<T>(target: Record<string, any>, key: string, subscriptions: Set<Noop>) {
    let value = target[key]

	Object.defineProperty(target, key, {
		get () {
        	effect_setup(subscriptions)
			return value
		},
		set (new_value: T) {
            if (equal(value, new_value)) return
			value = new_value
			effect_runner(subscriptions)
		},
        valueOf() {
			return value
		},
		toString() {
			return value
		}
	} as Record<string, any>)
}

/**
 * Creates a reactive state object.
 *
 * @template T The type of the value to be made reactive.
 * @param value The initial value of the reactive state.
 * @returns The reactive state.
 *
 * If the input value is an object, the function will create a proxy for the object,
 * making its properties reactive. The proxy will trigger effects when its properties
 * are accessed or modified.
 *
 * If the input value is not an object, the function will create a reactive state object
 * with a `value` property. The `value` property can be accessed and modified, and the
 * object will trigger effects when the `value` has changed.
 *
 * The reactive state object or proxy will have `valueOf` and `toString` methods that
 * return the current value of the `value` property.
 * 
 * @example
 * const count = state(0);
 *
 * console.log(count.value); // 0
 *
 * count.value++;
 *
 * effect(() => {
 *     console.log(count.value); // 1
 * });
 * 
 * // or
 * 
 * effect(() => {
 *     console.log(+count); // 1
 * });
 */
export function state<T>(value: T): (T & Record<string, any>) | (T & null) | ReactiveObject<T> {
    const subscriptions = new Set<Noop>()

    if(typeof value === 'object') {
        Object.keys(value as object).map(prop => proxy(value as object, prop, subscriptions))
        return value
    }

    return {
        get value() {
            effect_setup(subscriptions)
            return value
        },
        set value(new_value) {
            if (equal(value, new_value)) return
            value = new_value
            effect_runner(subscriptions)
        },
        valueOf() {
            return this.value
        },
        toString() {
            return this.value
        }
    }
}
