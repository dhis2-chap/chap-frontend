import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { IconCalendar24 } from '@dhis2/ui';
import { PERIOD_TYPES } from '@dhis2-chap/ui';
import { useModels } from '@/hooks/useModels';
import { formatPeriodId } from '../../../utils/predictionRunMetadata';
import { SupportedPeriodType } from '../utils/predictionPeriods';
import styles from './PredictionSetupNoticeBox.module.css';

const PERIOD_TYPE_LABELS: Record<SupportedPeriodType, string> = {
    [PERIOD_TYPES.MONTH]: i18n.t('Monthly'),
    [PERIOD_TYPES.WEEK]: i18n.t('Weekly'),
};

type Props = {
    modelId: string;
    periodType: SupportedPeriodType;
    fromPeriod: string;
};

export const PredictionSetupNoticeBox = ({ modelId, periodType, fromPeriod }: Props) => {
    const { models } = useModels();

    const modelName = useMemo(() => {
        const model = models?.find(m => String(m.id) === modelId);
        return model?.displayName || model?.name || i18n.t('Unknown model');
    }, [models, modelId]);

    return (
        <div className={styles.noticeBox}>
            <span className={styles.icon}>
                <IconCalendar24 />
            </span>

            <span className={styles.title}>
                {i18n.t('Run a new prediction')}
            </span>

            <dl className={styles.metadata}>
                <div className={styles.metaRow}>
                    <dt className={styles.metaTerm}>{i18n.t('Model')}</dt>
                    <dd className={styles.metaDefinition}>{modelName}</dd>
                </div>
                <div className={styles.metaRow}>
                    <dt className={styles.metaTerm}>{i18n.t('Period type')}</dt>
                    <dd className={styles.metaDefinition}>{PERIOD_TYPE_LABELS[periodType]}</dd>
                </div>
                <div className={styles.metaRow}>
                    <dt className={styles.metaTerm}>{i18n.t('Training start')}</dt>
                    <dd className={styles.metaDefinition}>{formatPeriodId(fromPeriod) ?? fromPeriod}</dd>
                </div>
            </dl>
        </div>
    );
};
