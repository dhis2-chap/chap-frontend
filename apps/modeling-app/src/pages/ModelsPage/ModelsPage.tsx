import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { ModelsContent } from '../../components/PageContent/Models';

export const ModelsPage: React.FC = () => {
    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Models')}
                pageDescription={i18n.t('Manage configured models and explore model templates available in your system.')}
            />
            <ModelsContent />
        </>
    );
};
