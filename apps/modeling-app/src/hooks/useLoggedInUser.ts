import { useApiDataQuery } from '../utils/useApiDataQuery';

type User = {
    id: string;
    username: string;
    displayName: string;
    authorities: string[];
};

export const useLoggedInUser = () => {
    const fields = 'id,username,displayName,authorities';

    const { data, isLoading, error } = useApiDataQuery<User, Error, User>({
        queryKey: ['me', fields],
        query: {
            resource: 'me',
            params: {
                fields,
            },
        },
        staleTime: Infinity,
        cacheTime: Infinity,
        refetchOnWindowFocus: false,
    });

    return {
        user: data,
        isLoading,
        error,
    };
};
