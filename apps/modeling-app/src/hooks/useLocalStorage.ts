import { useState, useEffect, useCallback } from 'react';
import { addDays, isAfter } from 'date-fns';

type StoredValue<T> = {
    value: T;
    dismissedAt: string;
    version: string;
};

type UseLocalStorageOptions = {
    expirationDays?: number;
    currentVersion?: string;
};

export const useLocalStorage = <T>(
    key: string,
    initialValue: T,
    options: UseLocalStorageOptions = {},
): [T, (value: T) => void] => {
    const { expirationDays = 30, currentVersion = '1' } = options;

    const readValue = useCallback((): T => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            if (!item) {
                return initialValue;
            }

            const storedData: StoredValue<T> = JSON.parse(item);

            if (storedData.version !== currentVersion) {
                window.localStorage.removeItem(key);
                return initialValue;
            }

            const dismissedDate = new Date(storedData.dismissedAt);
            const expirationDate = addDays(dismissedDate, expirationDays);

            if (isAfter(new Date(), expirationDate)) {
                window.localStorage.removeItem(key);
                return initialValue;
            }

            return storedData.value;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    }, [key, initialValue, expirationDays, currentVersion]);

    const [storedValue, setStoredValue] = useState<T>(readValue);

    const setValue = useCallback(
        (value: T) => {
            if (typeof window === 'undefined') {
                console.warn(
                    `Tried setting localStorage key "${key}" even though environment is not a client`,
                );
                return;
            }

            try {
                const valueToStore: StoredValue<T> = {
                    value,
                    dismissedAt: new Date().toISOString(),
                    version: currentVersion,
                };

                window.localStorage.setItem(key, JSON.stringify(valueToStore));
                setStoredValue(value);
            } catch (error) {
                console.warn(`Error setting localStorage key "${key}":`, error);
            }
        },
        [key, currentVersion],
    );

    useEffect(() => {
        setStoredValue(readValue());
    }, [readValue]);

    return [storedValue, setValue];
};
