import { NoticeBox, Tooltip } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Pill, type ModelSpecRead } from '@dhis2-chap/ui';
import { hasRevisionMismatch, revisionMismatchMessage } from '@/utils/modelHealth';
import styles from './ModelHealth.module.css';

type Props = { model?: ModelSpecRead };

/**
 * Only an unhealthy model is flagged. A healthy one looks the same as a model
 * whose service cannot report health at all, so a positive badge would say
 * nothing a user can act on.
 */
export const ModelHealthBadge = ({ model }: Props) => {
    if (!hasRevisionMismatch(model)) return null;

    return (
        <Tooltip content={revisionMismatchMessage()}>
            <span data-test="model-health-badge">
                <Pill variant="destructive">{i18n.t('Revision mismatch')}</Pill>
            </span>
        </Tooltip>
    );
};

export const ModelHealthNotice = ({ model }: Props) => {
    if (!hasRevisionMismatch(model)) return null;

    return (
        <div role="alert" className={styles.notice}>
            <NoticeBox error title={i18n.t('Model unavailable')} dataTest="model-health-notice">
                {revisionMismatchMessage()}
            </NoticeBox>
        </div>
    );
};
