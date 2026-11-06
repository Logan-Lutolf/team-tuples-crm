// Durations include database execution and time spent waiting for a connection.
// Never log query parameters, personal records, or the database URL.
export async function timeDetails<T>(label: string, load: () => Promise<T>): Promise<T> {
    const started = performance.now()
    try { return await load() }
    finally {
        if (process.env.NODE_ENV === 'development') {
            console.info(`[details:${label}] ${Math.round(performance.now() - started)}ms`)
        }
    }
}
