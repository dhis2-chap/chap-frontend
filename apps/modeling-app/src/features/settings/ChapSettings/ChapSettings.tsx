import React, { useEffect } from 'react';
import { Card, CircularLoader, colors, NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './ChapSettings.module.css';
import { Route } from '../../../hooks/useRoute';
import { useChapStatus } from './hooks/useChapStatus';
import { ServerSecurityNotices } from './ServerSecurityNotices';

type Props = {
    route: Route;
};

const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <Card>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2>{i18n.t('CHAP settings')}</h2>
                </div>
                {children}
            </div>
        </Card>
    );
};

export const ChapSettings = ({ route }: Props) => {
    const { status, error, isLoading } = useChapStatus({ route });

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

    if (error || !status) {
        return (
            <Wrapper>
                <div>
                    <NoticeBox error title={i18n.t('An error occurred while connecting to the CHAP server.')} className={styles.mutedText}>
                        {i18n.t('Are you sure you have configured your route correctly? See the console for more details.')}
                    </NoticeBox>
                </div>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <div className={styles.settingsContainer}>
                <ServerSecurityNotices />

                <div className={styles.info}>
                    <div className={styles.infoHeader}>
                        <h3>{i18n.t('Server information')}</h3>
                    </div>

                    <div className={styles.infoGrid}>
                        {status.chap_core_version && (
                            <>
                                <span className={styles.label}>{i18n.t('CHAP Version')}</span>
                                <span className={styles.value}>{status.chap_core_version}</span>
                            </>
                        )}
                        {status.python_version && (
                            <>
                                <span className={styles.label}>{i18n.t('Python Version')}</span>
                                <span className={styles.value}>{status.python_version}</span>
                            </>
                        )}
                        {status.os && (
                            <>
                                <span className={styles.label}>{i18n.t('Operating System')}</span>
                                <span className={styles.value}>{status.os}</span>
                            </>
                        )}

                        <span className={styles.label}>{i18n.t('Status')}</span>
                        <span className={styles.value} style={{ color: colors.green600 }}>{i18n.t('Connected')}</span>
                    </div>
                </div>
            </div>
        </Wrapper>
    );
};
