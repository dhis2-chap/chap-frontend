import { ModelSpecRead, PredictionInfo } from '@dhis2-chap/ui';
import { QuantileMappingForm } from './QuantileMappingForm';
import styles from './PredictionImport.module.css';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
};

export const PredictionImport = ({ prediction, model }: Props) => {
    return (
        <div className={styles.container}>
            <QuantileMappingForm
                prediction={prediction}
                model={model}
            />
        </div>
    );
};
