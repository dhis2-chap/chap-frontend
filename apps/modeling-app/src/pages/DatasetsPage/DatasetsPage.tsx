import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { DatasetsContent } from '../../components/PageContent/Datasets';

export const DatasetsPage: React.FC = () => (
    <>
        <PageHeader
            pageTitle={i18n.t('Datasets')}
            pageDescription={i18n.t('Import data once and reuse it across evaluations.')}
        />
        <DatasetsContent />
    </>
);
