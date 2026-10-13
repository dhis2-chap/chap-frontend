import { useRoute } from '@dhis2-chap/ui';
import { CircularLoader } from '@dhis2/ui';
import { Navigate } from 'react-router-dom';
import styles from './RouteValidator.module.css';

type Props = {
    children: React.ReactNode;
};

export const RouteValidator = ({ children }: Props) => {
    const { route, isLoading } = useRoute();

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (!route) {
        return <Navigate to="/get-started" replace />;
    }

    return children;
};
