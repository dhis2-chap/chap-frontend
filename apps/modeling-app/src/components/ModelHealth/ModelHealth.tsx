import type { ModelSpecRead } from '@dhis2-chap/ui';
import { NoticeBox, Tag, Tooltip } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { getModelHealth, hasRevisionMismatch, revisionMismatchMessage } from '@/utils/modelHealth';
import styles from './ModelHealth.module.css';

type Props = { model?: ModelSpecRead };

export const ModelHealthBadge = ({ model }: Props) => {
    const health = getModelHealth(model);
    if (health !== 'live' && health !== 'revision_mismatch') return null;

    const mismatch = health === 'revision_mismatch';
    return (
        <Tooltip content={mismatch
            ? revisionMismatchMessage()
            : i18n.t('The model service is registered and matches the stored revision.')}
        >
            <Tag negative={mismatch} positive={!mismatch} dataTest="model-health-badge">
                {mismatch ? i18n.t('Revision mismatch') : i18n.t('Live')}
            </Tag>
        </Tooltip>
    );
};

export const ModelHealthNotice = ({ model }: Props) => {
    if (!hasRevisionMismatch(model)) return null;

    return (
        <div role="status" className={styles.notice}>
            <NoticeBox error title={i18n.t('Model unavailable')} dataTest="model-health-notice">
                {revisionMismatchMessage()}
            </NoticeBox>
        </div>
    );
};
