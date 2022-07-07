import { hrtime } from 'process';

const NANOS_PER_SECOND = 1_000_000_000;

export function nanosToSeconds(nanos: number) {
    return nanos / NANOS_PER_SECOND;
}

/**
 * Time the execution of an async operation.
 * 
 * @param {() => Promise} operation 
 */
export async function timeIt<T>(operation: () => Promise<T>): Promise<[number, T]> {
    const startTime = hrtime.bigint();
    const result = await operation();
    const endTime = hrtime.bigint();

    return [nanosToSeconds(Number(endTime - startTime)), result];
}
