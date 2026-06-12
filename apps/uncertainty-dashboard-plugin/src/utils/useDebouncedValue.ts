import { useEffect, useState } from 'react';

export const useDebouncedValue = <TValue>(value: TValue, delayMs: number): TValue => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedValue(value);
        }, delayMs);

        return () => window.clearTimeout(timeoutId);
    }, [value, delayMs]);

    return debouncedValue;
};
