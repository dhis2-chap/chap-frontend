import React, { useEffect } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, IconError24 } from '@dhis2/ui';
import { useNavigate } from 'react-router-dom';
import styles from './ChapValidator.module.css';
import { useChapStatus } from '../../features/settings/ChapSettings/hooks/useChapStatus';
import { useRoute } from '../../hooks/useRoute';

type Props = {
    children: React.ReactNode;
};

export const ChapValidator = ({ children }: Props) => {
    const { route } = useRoute();
    const { status, error, isLoading } = useChapStatus({ route });
    const navigate = useNavigate();

    useEffect(() => {
        if (error) {
            console.error('CHAP connection error:', error);
        }
    }, [error]);

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (error || !status) {
        return (
            <div className={styles.noChapContainer}>
                <div className={styles.noChapContent}>
                    <div className={styles.noChapIcon}>
                        <IconError24 />
                    </div>

                    <h1 className={styles.noChapTitle}>{i18n.t('Could not connect to CHAP')}</h1>

                    <div className={styles.noChapText}>
                        <p>{i18n.t('The app is not able to connect to the CHAP server.')}</p>
                        <p>{i18n.t('Please check your route configuration and make sure the CHAP server is running.')}</p>
                        <a
                            href="https://github.com/dhis2-chap/chap-core/wiki"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.noChapLink}
                        >
                            {i18n.t('Learn more about Modeling and CHAP')}
                        </a>
                    </div>

                    <Button onClick={() => navigate('/settings')}>
                        {i18n.t('Configure settings')}
                    </Button>
                </div>
            </div>
        );
    }

    return children;
};
