import { signal } from './signal'

export function promised<T>(promise: Promise<T>) {
    const result = signal<T | undefined>(undefined)
    const pending = signal<boolean>(true)
    const error = signal<Error | null>(null)

    promise
        .then(res => result(res))
        .catch(err => error(err))
        .finally(() => pending(false))

    return { result, error, pending }
}
