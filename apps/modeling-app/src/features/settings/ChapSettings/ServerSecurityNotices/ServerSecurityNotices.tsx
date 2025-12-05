import React from 'react';
import { NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from '../ChapSettings.module.css';
import { useRoute } from '../../../../hooks/useRoute';
import { useQuery } from '@tanstack/react-query';

export const ServerSecurityNotices = () => {
    const { route } = useRoute();

    const { data: status, isLoading, error } = useQuery({
        queryKey: ['chap-status', route?.url],
        enabled: !!route?.url,
        queryFn: () => fetch(`${route?.url.replace('/**', '')}/system-info`).then(res => res.json()),
        staleTime: Infinity,
        cacheTime: Infinity,
        refetchOnWindowFocus: false,
    });

    if (isLoading) {
        return null;
    }

    if (error || !status) {
        return (
            <NoticeBox title={i18n.t('Your server might not be secure')}>
                <span className={styles.mutedText}>
                    {i18n.t('CHAP currently does not have it\'s own authentication service. Make sure to secure it by blocking public access on your server firewall.')}
                </span>
            </NoticeBox>
        );
    }

    return (
        <>

            <NoticeBox error title={i18n.t('Your server is not secure')}>
                <span className={styles.mutedText}>
                    {i18n.t('CHAP currently does not have it\'s own authentication service. Make sure to secure it by blocking public access on your server firewall.')}
                </span>
            </NoticeBox>
        </>
    );
};
