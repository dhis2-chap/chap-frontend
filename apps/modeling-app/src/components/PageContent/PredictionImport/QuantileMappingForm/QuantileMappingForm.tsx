import React from 'react';
import * as z from 'zod';
import i18n from '@dhis2/d2-i18n';
import { PredictionInfo } from '@dhis2-chap/ui';
import { Button, ButtonStrip, IconImportItems24 } from '@dhis2/ui';
import styles from './QuantileMappingForm.module.css';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { DataItemSelect } from './DataItemSelect';
import { usePostPredictionData } from '../hooks/usePostPredictionData';
import { useNavigationBlocker } from '@/hooks/useNavigationBlocker';
import { NavigationConfirmModal } from '@/components/NavigationConfirmModal';
import { useNavigate } from 'react-router-dom';

type Props = {
    prediction: PredictionInfo;
};

export const quantileMappingSchema = z.object({
    quantile_low: z.string().min(1, { message: 'Quantile low is required' }),
    quantile_high: z.string().min(1, { message: 'Quantile high is required' }),
    median: z.string().min(1, { message: 'Median is required' }),
});

export const QuantileMappingForm = ({ prediction }: Props) => {
    const navigate = useNavigate();
    const {
        handleSubmit,
        formState: { errors, isDirty },
        setValue,
        clearErrors,
        control,
    } = useForm<z.infer<typeof quantileMappingSchema>>({
        resolver: zodResolver(quantileMappingSchema),
        defaultValues: {
            quantile_low: '',
            quantile_high: '',
            median: '',
        },
    });
    const { mutateAsync, isPending } = usePostPredictionData({
        onSuccess: () => {
            navigate(`/predictions/${prediction.id}`);
        },
    });

    const onSubmit = async (data: z.infer<typeof quantileMappingSchema>) => {
        await mutateAsync({
            predictionId: prediction.id,
            quantileMapping: {
                quantileLowId: data.quantile_low,
                quantileHighId: data.quantile_high,
                quantileMedianId: data.median,
            },
        });
    };

    const {
        showConfirmModal,
        handleConfirmNavigation,
        handleCancelNavigation,
    } = useNavigationBlocker({
        shouldBlock: !isPending && isDirty,
    });
    const { quantile_low, quantile_high, median } = useWatch({ control });

    const updateQuantile = (quantile: 'quantile_low' | 'median' | 'quantile_high', id: string | null) => {
        if (id) {
            clearErrors(quantile);
        }
        setValue(quantile, id ?? '', { shouldDirty: true });
    };

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
                    {i18n.t('Importing forecasted values into DHIS2 requires you to set up three data elements for the quantiles outputted by the model.')}
                </span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className={styles.dataItemSelects}>
                    <DataItemSelect
                        label={i18n.t('Quantile high')}
                        value={quantile_high}
                        onChange={id => updateQuantile('quantile_high', id)}
                        error={errors.quantile_high?.message}
                    />
                    <DataItemSelect
                        label={i18n.t('Median')}
                        value={median}
                        onChange={id => updateQuantile('median', id)}
                        error={errors.median?.message}
                    />
                    <DataItemSelect
                        label={i18n.t('Quantile low')}
                        value={quantile_low}
                        onChange={id => updateQuantile('quantile_low', id)}
                        error={errors.quantile_low?.message}
                    />

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
