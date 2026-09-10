import { NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from '../ChapSettings.module.css';
import { useRoute } from '../../../../hooks/useRoute';
import { useChapStatus } from '../hooks/useChapStatus';
import { hasRouteToken } from '../../../../components/ApiTokenField/routeToken';

export const ServerSecurityNotices = () => {
    const { route } = useRoute();
    const { status, isLoading, error } = useChapStatus({ route });

    if (isLoading || error || !status) {
        return null;
    }

    if (status.auth_required) {
        if (hasRouteToken(route?.headers)) {
            return null;
        }
        return (
            <NoticeBox warning title={i18n.t('CHAP requires an API token')}>
                <span className={styles.mutedText}>
                    {i18n.t('Edit the route settings to add the token configured on your CHAP server.')}
                </span>
            </NoticeBox>
        );
    }

    return (
        <NoticeBox title={i18n.t('Restrict access to your CHAP server')}>
            <span className={styles.mutedText}>
                {i18n.t('This server does not report API token protection. Keep it on a private network or restrict access with a firewall.')}
            </span>
        </NoticeBox>
    );
};
