import i18n from '@dhis2/d2-i18n';
import {
    Button,
    ButtonStrip,
    IconArrowRight16,
} from '@dhis2/ui';
import {
    DEFAULT_OUTBREAK_PROBABILITY,
    OUTBREAK_PROBABILITY_OPTIONS,
    OutbreakProbability,
    PredictionInfo,
    ModelSpecRead,
} from '@dhis2-chap/ui';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PredictionAlertsConfigurator } from './PredictionAlertsConfigurator';
import styles from './PredictionAlerts.module.css';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
};

export const PredictionAlerts = ({ prediction, model }: Props) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedProbability = Number(searchParams.get('alertProbability')) as OutbreakProbability
        || DEFAULT_OUTBREAK_PROBABILITY;
    const normalizedProbability = OUTBREAK_PROBABILITY_OPTIONS.includes(selectedProbability)
        ? selectedProbability
        : DEFAULT_OUTBREAK_PROBABILITY;
    const returnTo = prediction.configuredModelWithDataSource?.id
        ? `/predictions/${prediction.configuredModelWithDataSource.id}`
        : '/predictions';

    const handleSelectProbability = (probability: OutbreakProbability) => {
        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.set('alertProbability', String(probability));
        setSearchParams(nextSearchParams, { replace: true });
    };

    const handleContinue = () => {
        navigate(`/predictions/runs/${prediction.id}/import`, {
            state: {
                alertProbability: normalizedProbability,
            },
        });
    };

    const handleCancel = () => {
        navigate(returnTo);
    };

    return (
        <>
            <PredictionAlertsConfigurator
                prediction={prediction}
                model={model}
                selectedProbability={normalizedProbability}
                onSelectProbability={handleSelectProbability}
            />
            <div className={styles.actionBar}>
                <ButtonStrip end>
                    <Button onClick={handleCancel}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        icon={<IconArrowRight16 />}
                        onClick={handleContinue}
                    >
                        {i18n.t('Continue')}
                    </Button>
                </ButtonStrip>
            </div>
        </>
    );
};
