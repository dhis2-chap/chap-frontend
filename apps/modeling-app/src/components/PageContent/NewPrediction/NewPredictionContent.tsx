import i18n from '@dhis2/d2-i18n';
import { useMemo } from 'react';
import { useInitialFormState } from '@/pages/NewEvaluationPage/hooks/useInitialFormState';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import { useParams } from 'react-router-dom';
import styles from './NewPredictionContent.module.css';
import { useModels } from '@/hooks/useModels';
import { NewPredictionForm } from '@/components/NewPredictionForm';
import { usePredictionSetup } from '@/hooks/usePredictionSetup';
import { parseSupportedPeriodType } from '@/utils/periods';

type Props = {
    returnTo?: string;
};

export const NewPredictionContent = ({ returnTo }: Props) => {
    const { predictionSetupId: predictionSetupIdParam } = useParams();
    const predictionSetupId = predictionSetupIdParam ? Number(predictionSetupIdParam) : undefined;
    const hasValidSetupId = predictionSetupId !== undefined && Number.isFinite(predictionSetupId);

    const {
        predictionSetup,
        isLoading: isSetupLoading,
        error: setupError,
    } = usePredictionSetup(hasValidSetupId ? predictionSetupId : undefined);

    const { models, isLoading: isModelsLoading, error: modelsError } = useModels();

    const stateOverride = useMemo(() => {
        if (!predictionSetup) {
            return null;
        }

        const periodType = parseSupportedPeriodType(predictionSetup.periodType);

        return {
            name: i18n.t('{{name}} prediction', { name: predictionSetup.name }) as string,
            periodType,
            fromPeriodId: periodType ? predictionSetup.startPeriod ?? undefined : undefined,
            orgUnits: predictionSetup.orgUnits,
            modelId: predictionSetup.configuredModel?.id != null
                ? String(predictionSetup.configuredModel.id)
                : undefined,
            dataSources: predictionSetup.covariateSources,
        };
    }, [predictionSetup]);

    const { initialValues, isLoading: isInitialValuesLoading } = useInitialFormState({
        models,
        isModelsLoading,
        stateOverride,
    });

    if (!hasValidSetupId) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox error title={i18n.t('Cannot run prediction')}>
                    {i18n.t('Missing prediction setup id.')}
                </NoticeBox>
            </div>
        );
    }

    if (isSetupLoading || isInitialValuesLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (modelsError) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox error title={i18n.t('Error loading models')}>
                    {modelsError.message || i18n.t('An unknown error occurred')}
                </NoticeBox>
            </div>
        );
    }

    if (setupError || !predictionSetup) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox error title={i18n.t('Error loading prediction setup')}>
                    {setupError?.message || i18n.t('Prediction setup not found.')}
                </NoticeBox>
            </div>
        );
    }

    return (
        <NewPredictionForm
            predictionSetupId={predictionSetup.id}
            initialValues={initialValues}
            returnTo={returnTo}
        />
    );
};
