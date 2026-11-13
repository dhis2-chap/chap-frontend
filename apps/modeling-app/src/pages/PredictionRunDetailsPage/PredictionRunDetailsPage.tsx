import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, IconArrowLeft16 } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import styles from './PredictionRunDetailsPage.module.css';
import {
    getDefaultPredictionRunAlertSettings,
    PredictionDetailsGrid,
    type PredictionRunAlertSettings,
} from '../../components/PageContent/PredictionDetails/PredictionDetailsGrid';
import { PredictionRunLoader } from '../../components/PredictionRunLoader';

export const PredictionRunDetailsPage: React.FC = () => {
    const navigate = useNavigate();
    const { predictionSetupId } = useParams();
    const [settings, setSettings] = useState<PredictionRunAlertSettings>(
        getDefaultPredictionRunAlertSettings,
    );
    const returnTo = predictionSetupId ? `/predictions/${predictionSetupId}` : '/predictions';

    const handleImport = (predictionId: number) => {
        if (!predictionSetupId) {
            return;
        }

        navigate(`/predictions/${predictionSetupId}/runs/${predictionId}/import`, {
            state: {
                alertProbability: settings.alertProbability,
                thresholdParams: settings.thresholdParams,
                useAlertOutputs: settings.thresholdsEnabled,
            },
        });
    };

    return (
        <PredictionRunLoader>
            {({ prediction, model }) => (
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
                            prediction={prediction}
                            model={model}
                            settings={settings}
                            onSettingsChange={setSettings}
                            onImport={() => handleImport(prediction.id)}
                        />
                    </div>
                </>
            )}
        </PredictionRunLoader>
    );
};
