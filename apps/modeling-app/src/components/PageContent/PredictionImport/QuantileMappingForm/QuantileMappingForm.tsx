import type { KeyboardEvent, MouseEvent } from 'react';
import * as z from 'zod';
import i18n from '@dhis2/d2-i18n';
import {
    buildOutbreakIndicators,
    calculateMockEndemicThreshold,
    MINIMUM_THRESHOLD_OBSERVATIONS,
    ModelSpecRead,
    OutbreakProbability,
    parseOutbreakProbability,
    PredictionInfo,
} from '@dhis2-chap/ui';
import {
    Button,
    ButtonStrip,
    CircularLoader,
    IconArrowRight16,
    IconImportItems24,
    NoticeBox,
    Switch,
} from '@dhis2/ui';
import styles from './QuantileMappingForm.module.css';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { DataItemSelect } from './DataItemSelect';
import { usePostPredictionData } from '../hooks/usePostPredictionData';
import { useNavigationBlocker } from '@/hooks/useNavigationBlocker';
import { NavigationConfirmModal } from '@/components/NavigationConfirmModal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePredictionSeries } from '../../PredictionDetails/hooks/usePredictionSeries';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
};

export const quantileMappingSchema = z.object({
    quantile_low: z.string().min(1, { message: 'Quantile low is required' }),
    quantile_high: z.string().min(1, { message: 'Quantile high is required' }),
    median: z.string().min(1, { message: 'Median is required' }),
    quantile_mid_low: z.string().min(1, { message: 'Quantile mid low is required' }),
    quantile_mid_high: z.string().min(1, { message: 'Quantile mid high is required' }),
    use_alert_outputs: z.boolean(),
    outbreak_indicator: z.string(),
}).superRefine((values, context) => {
    if (values.use_alert_outputs && !values.outbreak_indicator) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['outbreak_indicator'],
            message: 'Outbreak indicator is required',
        });
    }
});

type QuantileMappingFormValues = z.infer<typeof quantileMappingSchema>;
type MappingField = keyof QuantileMappingFormValues;

export const QuantileMappingForm = ({ prediction, model }: Props) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const selectedProbability = parseOutbreakProbability(searchParams.get('alertProbability'));
    const {
        series,
        isLoading: isSeriesLoading,
        error: seriesError,
    } = usePredictionSeries({ prediction, model });
    const outbreakIndicators = buildOutbreakIndicators(
        series,
        selectedProbability as OutbreakProbability,
    );
    const unavailableThresholdCount = series.filter(orgUnitSeries => (
        !calculateMockEndemicThreshold(orgUnitSeries.actualCases).available
    )).length;
    const {
        handleSubmit,
        formState: { errors, isDirty },
        setValue,
        clearErrors,
        control,
    } = useForm<QuantileMappingFormValues>({
        resolver: zodResolver(quantileMappingSchema),
        defaultValues: {
            quantile_low: '',
            quantile_high: '',
            median: '',
            quantile_mid_low: '',
            quantile_mid_high: '',
            use_alert_outputs: true,
            outbreak_indicator: '',
        },
    });
    const { mutateAsync, isPending } = usePostPredictionData({
        onSuccess: () => {
            const configuredModelWithDataSourceId = prediction.configuredModelWithDataSource?.id;
            navigate(configuredModelWithDataSourceId
                ? `/predictions/${configuredModelWithDataSourceId}`
                : '/predictions');
        },
    });

    const onSubmit = async (data: QuantileMappingFormValues) => {
        await mutateAsync({
            predictionId: prediction.id,
            quantileMapping: {
                quantileLowId: data.quantile_low,
                quantileHighId: data.quantile_high,
                quantileMedianId: data.median,
                quantileMidLowId: data.quantile_mid_low,
                quantileMidHighId: data.quantile_mid_high,
                outbreakIndicatorId: data.use_alert_outputs ? data.outbreak_indicator : '',
            },
            outbreakIndicators: data.use_alert_outputs ? outbreakIndicators : [],
        });
    };

    const {
        showConfirmModal,
        handleConfirmNavigation,
        handleCancelNavigation,
    } = useNavigationBlocker({
        shouldBlock: !isPending && isDirty,
    });
    const { quantile_low, quantile_high, median, quantile_mid_low, quantile_mid_high, use_alert_outputs, outbreak_indicator } = useWatch({ control });

    const updateQuantile = (quantile: MappingField, id: string | null) => {
        if (id) {
            clearErrors(quantile);
        }
        setValue(quantile, id ?? '', { shouldDirty: true });
    };

    const toggleAlertOutputs = () => {
        setValue('use_alert_outputs', !use_alert_outputs, { shouldDirty: true });
        clearErrors('outbreak_indicator');
    };

    const handleAlertOutputKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleAlertOutputs();
        }
    };

    const handleSwitchClick = (event: MouseEvent) => {
        event.stopPropagation();
    };

    if (isSeriesLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (seriesError) {
        return (
            <NoticeBox error title={i18n.t('Unable to load alert data')}>
                {i18n.t('There was a problem loading the prediction data required for outbreak indicator import.')}
            </NoticeBox>
        );
    }

    return (
        <>
            <div className={styles.customNoticeBox}>
                <span>
                    <IconImportItems24 />
                </span>

                <span className={styles.title}>
                    {i18n.t('Import forecasted values')}
                </span>

                <span className={styles.description}>
                    {i18n.t('Importing forecasted values into DHIS2 requires you to set up five data elements for the quantiles outputted by the model.')}
                </span>
            </div>

            {unavailableThresholdCount > 0 && (
                <NoticeBox warning title={i18n.t('Some outbreak indicators will be skipped')}>
                    {i18n.t('Outbreak indicators will be skipped for {{count}} regions without at least {{minimum}} historical observations.', {
                        count: unavailableThresholdCount,
                        minimum: MINIMUM_THRESHOLD_OBSERVATIONS,
                    })}
                </NoticeBox>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className={styles.dataItemSelects}>
                    <DataItemSelect
                        label={i18n.t('Quantile high')}
                        value={quantile_high}
                        onChange={id => updateQuantile('quantile_high', id)}
                        error={errors.quantile_high?.message}
                    />
                    <DataItemSelect
                        label={i18n.t('Quantile mid high')}
                        value={quantile_mid_high}
                        onChange={id => updateQuantile('quantile_mid_high', id)}
                        error={errors.quantile_mid_high?.message}
                    />
                    <DataItemSelect
                        label={i18n.t('Median')}
                        value={median}
                        onChange={id => updateQuantile('median', id)}
                        error={errors.median?.message}
                    />
                    <DataItemSelect
                        label={i18n.t('Quantile mid low')}
                        value={quantile_mid_low}
                        onChange={id => updateQuantile('quantile_mid_low', id)}
                        error={errors.quantile_mid_low?.message}
                    />
                    <DataItemSelect
                        label={i18n.t('Quantile low')}
                        value={quantile_low}
                        onChange={id => updateQuantile('quantile_low', id)}
                        error={errors.quantile_low?.message}
                    />

                    <div className={styles.alertOutput}>
                        <h3>{i18n.t('Alert output')}</h3>
                        <div
                            className={styles.alertOutputToggle}
                            onClick={toggleAlertOutputs}
                            onKeyDown={handleAlertOutputKeyDown}
                            role="button"
                            tabIndex={0}
                        >
                            <div className={styles.alertOutputToggleText}>
                                <span className={styles.alertOutputToggleTitle}>
                                    {i18n.t('Use alert outputs')}
                                </span>
                                <span className={styles.alertOutputToggleDescription}>
                                    {i18n.t('Import outbreak indicator values.')}
                                </span>
                            </div>
                            <span onClick={handleSwitchClick}>
                                <Switch
                                    checked={use_alert_outputs}
                                    onChange={toggleAlertOutputs}
                                />
                            </span>
                        </div>
                        {use_alert_outputs && (
                            <>
                                <div className={styles.alertSummary}>
                                    <div>
                                        <span className={styles.summaryLabel}>
                                            {i18n.t('Minimum outbreak probability')}
                                        </span>
                                        <span className={styles.summaryValue}>
                                            {`${selectedProbability}%`}
                                        </span>
                                    </div>
                                    <Button
                                        small
                                        icon={<IconArrowRight16 />}
                                        onClick={() => navigate(`/predictions/runs/${prediction.id}/alerts?alertProbability=${selectedProbability}`)}
                                    >
                                        {i18n.t('Adjust alerts')}
                                    </Button>
                                </div>
                                <div className={styles.outbreakIndicatorField}>
                                    <DataItemSelect
                                        label={i18n.t('Outbreak indicator')}
                                        value={outbreak_indicator}
                                        onChange={id => updateQuantile('outbreak_indicator', id)}
                                        error={errors.outbreak_indicator?.message}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <ButtonStrip end className={styles.buttonStrip}>
                        <Button
                            type="submit"
                            loading={isPending}
                            primary
                        >
                            {i18n.t('Import')}
                        </Button>
                    </ButtonStrip>
                </div>

            </form>

            {showConfirmModal && (
                <NavigationConfirmModal
                    onConfirm={handleConfirmNavigation}
                    onCancel={handleCancelNavigation}
                />
            )}
        </>
    );
};
