import i18n from '@dhis2/d2-i18n';
import { ModelSpecRead, PredictionInfo } from '@dhis2-chap/ui';
import { NoticeBox } from '@dhis2/ui';
import { useParams } from 'react-router-dom';
import { QuantileMappingForm } from './QuantileMappingForm';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
};

const parsePredictionSetupId = (configuredId: string | undefined): number | undefined => {
    if (!configuredId) {
        return undefined;
    }

    const parsed = Number(configuredId);
    return Number.isFinite(parsed) ? parsed : undefined;
};

export const QuantileMappingFormContainer = ({ prediction, model }: Props) => {
    const { configuredId } = useParams();
    const predictionSetupId = parsePredictionSetupId(configuredId);

    if (predictionSetupId === undefined) {
        return (
            <NoticeBox error title={i18n.t('Cannot import prediction')}>
                {i18n.t('Missing or invalid prediction setup id.')}
            </NoticeBox>
        );
    }

    return (
        <QuantileMappingForm
            prediction={prediction}
            model={model}
            predictionSetupId={predictionSetupId}
        />
    );
};
