import React, { useEffect } from 'react';
import { Card, CircularLoader, Button, NoticeBox, IconSettings16 } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useNavigate } from 'react-router-dom';
import styles from './ModelSettings.module.css';
import { useModels } from '../../../hooks/useModels';

const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <Card>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2>{i18n.t('Model settings')}</h2>
                </div>

                {children}
            </div>
        </Card>
    );
};

export const ModelSettings = () => {
    const { models, error, isLoading } = useModels();
    const navigate = useNavigate();

    useEffect(() => {
        if (error) {
            console.error(error);
        }
    }, [error]);

    if (isLoading) {
        return (
            <Wrapper>
                <div className={styles.loaderContainer}>
                    <CircularLoader />
                </div>
            </Wrapper>
        );
    }

    if (error) {
        return (
            <Wrapper>
                <div>
                    <NoticeBox error title={i18n.t('An error occurred while loading models.')} className={styles.mutedText}>
                        {i18n.t('Please try to reload the page. If the problem persists, contact your system administrator.')}
                    </NoticeBox>
                </div>
            </Wrapper>
        );
    }

    const handleConfigureModels = () => {
        navigate('/settings/models');
    };

    return (
        <Wrapper>
            <div className={styles.settingsContainer}>
                <NoticeBox title={i18n.t('Model templates')}>
                    {i18n.t('Model templates are base models that can be configured to fit your data with different parameters and covariates. This is still an advanced feature and should be used with caution.')}
                </NoticeBox>
                <div className={styles.info}>
                    <div className={styles.infoHeader}>
                        <h3>{i18n.t('Configured models')}</h3>

                        <Button
                            small
                            onClick={handleConfigureModels}
                            icon={<IconSettings16 />}
                        >
                            {i18n.t('Configure')}
                        </Button>
                    </div>

                    <div className={styles.infoGrid}>
                        <span className={styles.label}>{i18n.t('Models configured')}</span>
                        <span className={styles.value}>{models?.length || 0}</span>
                    </div>
                </div>
            </div>
        </Wrapper>
    );
};
