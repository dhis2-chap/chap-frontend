import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader } from '@dhis2/ui';
import { Widget } from '@dhis2-chap/ui';
import type { PredictionSetupReadWithPredictions } from '@dhis2-chap/ui';
import { useNavigate } from 'react-router-dom';
import { useDataset } from '../../../../hooks/useDataset';
import { getChapErrorLabel } from '../../../../utils/chapErrors';
import { calculateInputCompleteness, getInputPeriods } from '../../../InputCompleteness/inputCompleteness';
import styles from './InputDataCheckWidget.module.css';

type Props = {
    predictionSetup?: PredictionSetupReadWithPredictions;
    latestDatasetId?: number;
};

export const InputDataCheckWidget = ({ predictionSetup, latestDatasetId }: Props) => {
    const navigate = useNavigate();
    const { data: dataset, error, isLoading } = useDataset(latestDatasetId);

    // Expected locations follow the setup, not the dataset, so locations absent from the saved data still count as gaps.
    const completeness = useMemo(() => {
        if (!dataset || !predictionSetup) return [];
        const periods = getInputPeriods(
            dataset.firstPeriod ?? '',
            dataset.lastPeriod ?? '',
            dataset.periodType ?? predictionSetup.periodType,
        );
        return calculateInputCompleteness(
            dataset.observations,
            periods,
            predictionSetup.orgUnits,
            [dataset.targetColumn ?? 'disease_cases'],
        );
    }, [dataset, predictionSetup]);
    const latest = completeness[completeness.length - 1];
    const periodsWithGaps = completeness.filter(row => row.available < row.expected).length;

    const renderContent = () => {
        if (latestDatasetId == null) {
            return <span className={styles.muted}>{i18n.t('Run a prediction to check its input data.')}</span>;
        }
        if (isLoading) return <CircularLoader small />;
        if (error || !dataset) {
            return <span className={styles.muted}>{getChapErrorLabel(error, i18n.t('Unable to load input data.'))}</span>;
        }
        if (!latest?.expected) {
            return <span className={styles.muted}>{i18n.t('Completeness unavailable for this dataset.')}</span>;
        }
        return (
            <>
                <span className={styles.label}>
                    {i18n.t('Latest period ({{period}})', { period: latest.period })}
                </span>
                <span className={styles.value} data-test="input-data-check-latest">
                    {i18n.t('{{percent}}% complete', { percent: ((latest.completeness ?? 0) * 100).toFixed(0) })}
                    {latest.missing.length > 0 && (
                        <span className={styles.muted}>
                            {' · '}
                            {i18n.t('{{count}} locations with gaps', {
                                count: latest.missing.length,
                                defaultValue: '{{count}} location with gaps',
                                defaultValue_plural: '{{count}} locations with gaps',
                            })}
                        </span>
                    )}
                </span>
                <span className={styles.muted}>
                    {i18n.t('{{gaps}} of {{total}} periods have missing values', {
                        gaps: periodsWithGaps,
                        total: completeness.length,
                    })}
                </span>
            </>
        );
    };

    return (
        <Widget header={i18n.t('Latest input data')} noncollapsible>
            <div className={styles.content}>
                {renderContent()}
                {latestDatasetId != null && (
                    <Button small secondary onClick={() => navigate(`/datasets/${latestDatasetId}`)}>
                        {i18n.t('View dataset')}
                    </Button>
                )}
            </div>
        </Widget>
    );
};
