import { useBlocker } from 'react-router-dom';
import { useCallback } from 'react';

type Props = {
    shouldBlock: boolean;
};

export const useNavigationBlocker = ({ shouldBlock }: Props) => {
    const blocker = useBlocker(({ currentLocation, nextLocation }) => shouldBlock && currentLocation.pathname !== nextLocation.pathname);

    const handleConfirmNavigation = useCallback(() => {
        if (blocker.state === 'blocked') {
            blocker.proceed();
        }
    }, [blocker]);

    const handleCancelNavigation = useCallback(() => {
        if (blocker.state === 'blocked') {
            blocker.reset?.();
        }
    }, [blocker]);

    return {
        showConfirmModal: blocker.state === 'blocked',
        handleConfirmNavigation,
        handleCancelNavigation,
    };
};
