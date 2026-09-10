import { NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from '../ChapSettings.module.css';
import { useRoute } from '../../../../hooks/useRoute';
import { useChapStatus } from '../hooks/useChapStatus';
import { useChapAuthStatus } from '../hooks/useChapAuthStatus';
import { hasRouteToken } from '../../../../components/ApiTokenField/routeToken';

export const ServerSecurityNotices = () => {
    const { route } = useRoute();
    const { status, isLoading, error } = useChapStatus({ route });
    const { isUnauthorized } = useChapAuthStatus();

    if (isLoading || error || !status) {
        return null;
    }

    const tokenConfigured = hasRouteToken(route?.headers);

    if (isUnauthorized) {
        return tokenConfigured ? (
            <NoticeBox error title={i18n.t('The CHAP server rejected the API token')}>
                <span className={styles.mutedText}>
                    {i18n.t('The server is reachable, but requests are refused. Check the token for typos, then edit the route settings to enter the token configured on your CHAP server.')}
                </span>
            </NoticeBox>
        ) : (
            <NoticeBox error title={i18n.t('No API token is configured')}>
                <span className={styles.mutedText}>
                    {i18n.t('The server is reachable, but it refuses requests without a token. Edit the route settings to add the token configured on your CHAP server.')}
                </span>
            </NoticeBox>
        );
    }

    if (status.auth_required) {
        if (tokenConfigured) {
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
