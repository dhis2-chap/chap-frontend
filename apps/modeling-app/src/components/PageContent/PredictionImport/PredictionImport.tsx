import { ModelSpecRead, PredictionInfo } from '@dhis2-chap/ui';
import { QuantileMappingFormContainer } from './QuantileMappingForm/QuantileMappingFormContainer';
import styles from './PredictionImport.module.css';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
};

export const PredictionImport = ({ prediction, model }: Props) => {
    return (
        <div className={styles.container}>
            <QuantileMappingFormContainer
                prediction={prediction}
                model={model}
            />
        </div>
    );
};
