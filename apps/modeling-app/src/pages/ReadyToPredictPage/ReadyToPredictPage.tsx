import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { ReadyToPredictContent } from '../../components/PageContent/ReadyToPredict';

export const ReadyToPredictPage: React.FC = () => {
    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Ready to predict')}
                pageDescription={i18n.t('Saved model configurations that are ready to be used to generate predictions, either on demand or on a schedule.')}
            />
            <ReadyToPredictContent />
        </>
    );
};
