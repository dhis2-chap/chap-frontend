import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Button,
    CircularLoader,
    IconArrowLeft16,
    NoticeBox,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { usePredictionById } from '../../components/PageContent/PredictionDetails/hooks/usePredictionById';
import { useModels } from '../../hooks/useModels';
import styles from './PredictionRunDetailsPage.module.css';
import {
    getDefaultPredictionRunAlertSettings,
    PredictionDetailsGrid,
    type PredictionRunAlertSettings,
} from '../../components/PageContent/PredictionDetails/PredictionDetailsGrid';

export const PredictionRunDetailsPage: React.FC = () => {
    const navigate = useNavigate();
    const { configuredId, predictionId } = useParams();
    const [savedSettings, setSavedSettings] = useState<PredictionRunAlertSettings>(
        getDefaultPredictionRunAlertSettings,
    );
    const [draftSettings, setDraftSettings] = useState<PredictionRunAlertSettings>(
        getDefaultPredictionRunAlertSettings,
    );
    const [isEditing, setIsEditing] = useState(false);
    const { prediction, error, isLoading, isError } = usePredictionById(predictionId);
    const {
        models,
        error: modelsError,
        isLoading: isModelsLoading,
    } = useModels({ includeArchived: true });
    const model = models?.find(modelSpec => modelSpec.name === prediction?.modelId);
    const returnTo = configuredId ? `/predictions/${configuredId}` : '/predictions';
    const settings = isEditing ? draftSettings : savedSettings;

    const handleEdit = () => {
        setDraftSettings(savedSettings);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setDraftSettings(savedSettings);
        setIsEditing(false);
    };

    const handleSave = () => {
        setSavedSettings(draftSettings);
        setIsEditing(false);
    };

    const handleImport = () => {
        if (!prediction || !configuredId) {
            return;
        }

        navigate(`/predictions/${configuredId}/runs/${prediction.id}/import`, {
            state: {
                alertProbability: savedSettings.alertProbability,
                useAlertOutputs: savedSettings.thresholdsEnabled,
            },
        });
    };

    if (isLoading || (prediction && isModelsLoading)) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (isError) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox error title={i18n.t('Error loading prediction') as string}>
                    {error?.message || (i18n.t('An unknown error occurred') as string)}
                </NoticeBox>
            </div>
        );
    }

    if (!prediction) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox error title={i18n.t('Prediction not found')}>
                    {i18n.t('The prediction you are looking for does not exist or you do not have permission to access it.')}
                </NoticeBox>
            </div>
        );
    }

    if (modelsError || !model) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox error title={i18n.t('Model not found')}>
                    {i18n.t('The model for this prediction could not be loaded.')}
                </NoticeBox>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Prediction details')}
                pageDescription={prediction.name || i18n.t('Unnamed prediction')}
            />
            <Button
                className={styles.backButton}
                small
                icon={<IconArrowLeft16 />}
                onClick={() => navigate(returnTo)}
            >
                {i18n.t('Back to prediction setup')}
            </Button>
            <div className={styles.content}>
                <PredictionDetailsGrid
                    isEditing={isEditing}
                    prediction={prediction}
                    model={model}
                    settings={settings}
                    onSettingsChange={setDraftSettings}
                    onEdit={handleEdit}
                    onCancel={handleCancel}
                    onSave={handleSave}
                    onImport={handleImport}
                />
            </div>
        </>
    );
};
