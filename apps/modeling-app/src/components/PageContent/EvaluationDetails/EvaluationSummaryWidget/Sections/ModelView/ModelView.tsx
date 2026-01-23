import i18n from '@dhis2/d2-i18n';
import styles from '../../EvaluationSummaryWidget.module.css';

type Model = {
    id: number;
    displayName?: string;
};

type Props = {
    models?: Model[] | null;
    configuredModelId?: number | null;
};

export const ModelView = ({ models, configuredModelId }: Props) => {
    if (!models || !configuredModelId) {
        return null;
    }

    const modelDisplayName = models.find(model => model.id === configuredModelId)?.displayName;

    if (!modelDisplayName) {
        return null;
    }

    return (
        <div className={styles.row}>
            <span className={styles.label}>
                {i18n.t('Model')}
            </span>
            <span className={styles.value}>
                {modelDisplayName}
            </span>
        </div>
    );
};
