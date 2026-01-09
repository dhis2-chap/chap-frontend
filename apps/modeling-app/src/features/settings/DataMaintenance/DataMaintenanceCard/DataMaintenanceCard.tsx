import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useAuthority } from '../../../../hooks/useAuthority';
import { ConditionalTooltip } from '../../../../components/ConditionalTooltip';
import styles from './DataMaintenanceCard.module.css';

export const DataMaintenanceCard = () => {
    const navigate = useNavigate();
    const { isSuperUser, isLoading } = useAuthority({ authority: 'ALL' });

    const handleGoToPruning = () => {
        navigate('/settings/data-maintenance/pruning');
    };

    const isButtonDisabled = isLoading || !isSuperUser;

    return (
        <Card>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2>{i18n.t('Data Maintenance')}</h2>
                </div>

                <div className={styles.section}>
                    <h3>{i18n.t('Data Pruning')}</h3>
                    <p className={styles.description}>
                        {i18n.t('Permanently delete ALL data values for selected data elements across all organisation units and time periods. This action cannot be undone.')}
                    </p>

                    <div className={styles.buttonContainer}>
                        <ConditionalTooltip
                            enabled={!isSuperUser && !isLoading}
                            content={i18n.t('You need ALL authority to perform data pruning operations')}
                        >
                            <Button
                                onClick={handleGoToPruning}
                                disabled={isButtonDisabled}
                            >
                                {i18n.t('Go to Data Pruning')}
                            </Button>
                        </ConditionalTooltip>
                    </div>
                </div>
            </div>
        </Card>
    );
};
