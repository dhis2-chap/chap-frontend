import { useSearchParams } from 'react-router-dom';

/** The app path in `returnTo`, such as the guided setup that opened the page. Other values are ignored. */
export const useReturnTo = () => {
    const [searchParams] = useSearchParams();
    const returnTo = searchParams.get('returnTo');
    return returnTo?.startsWith('/') ? returnTo : undefined;
};
