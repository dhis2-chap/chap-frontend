import { useMutation } from '@tanstack/react-query';
import { useDataEngine } from '@dhis2/app-runtime';
import { DataElement } from '../DataElementSelector';

export interface PruningResult {
    dataElement: DataElement;
    success: boolean;
    error?: string;
}

interface UseDataPruningOptions {
    onSuccess?: (results: PruningResult[]) => void;
    onError?: (error: Error) => void;
}

export const useDataPruning = (options?: UseDataPruningOptions) => {
    const dataEngine = useDataEngine();

    const mutation = useMutation<PruningResult[], Error, DataElement[]>({
        mutationFn: async (dataElements: DataElement[]) => {
            const prunePromises = dataElements.map(async (dataElement) => {
                const pruneMutation = {
                    resource: `maintenance/dataPruning/dataElements/${dataElement.id}`,
                    type: 'create' as const,
                    data: {},
                };

                try {
                    await dataEngine.mutate(pruneMutation);
                    return {
                        dataElement,
                        success: true,
                    };
                } catch (error) {
                    return {
                        dataElement,
                        success: false,
                        error: error instanceof Error ? error.message : String(error),
                    };
                }
            });

            const results = await Promise.allSettled(prunePromises);

            return results.map((result) => {
                if (result.status === 'fulfilled') {
                    return result.value;
                }
                return {
                    dataElement: { id: 'unknown', displayName: 'Unknown' },
                    success: false,
                    error: result.reason instanceof Error
                        ? result.reason.message
                        : String(result.reason),
                };
            });
        },
        onSuccess: (results) => {
            options?.onSuccess?.(results);
        },
        onError: (error) => {
            options?.onError?.(error);
        },
    });

    return {
        pruneDataElements: mutation.mutate,
        pruneDataElementsAsync: mutation.mutateAsync,
        isPending: mutation.isPending,
        results: mutation.data,
        error: mutation.error,
        reset: mutation.reset,
    };
};
