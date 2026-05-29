import i18n from '@dhis2/d2-i18n';
import { ModelSpecRead, PredictionInfo } from '@dhis2-chap/ui';
import { NoticeBox } from '@dhis2/ui';
import { useParams } from 'react-router-dom';
import { QuantileMappingForm } from './QuantileMappingForm';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
};

export const QuantileMappingFormContainer = ({ prediction, model }: Props) => {
    const { predictionSetupId: predictionSetupIdParam } = useParams();
    const parsedPredictionSetupId = predictionSetupIdParam
        ? Number(predictionSetupIdParam)
        : undefined;
    const predictionSetupId = parsedPredictionSetupId !== undefined &&
        Number.isFinite(parsedPredictionSetupId)
        ? parsedPredictionSetupId
        : undefined;

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
