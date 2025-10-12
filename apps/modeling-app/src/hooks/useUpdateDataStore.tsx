import { useDataMutation } from '@dhis2/app-runtime';

export const REQUEST = (data: any, key: string, method: 'update' | 'create') => {
    return {
        resource: `dataStore/modeling/${key}`,
        type: method,
        id: '',
        data: data,
    };
};

const usePostDataStore = (data: any, key: string, method: 'update' | 'create') => {
    const [mutate, { error, loading, called }] = useDataMutation(REQUEST(data, key, method));

    // await mutate();

    return {
        error,
        loading,
        called,
        mutate,
    };
};

export default usePostDataStore;
