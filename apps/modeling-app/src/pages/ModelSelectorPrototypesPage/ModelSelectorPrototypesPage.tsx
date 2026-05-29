import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { ModelSelectorPrototypesPlayground } from '../../components/ModelSelectorPrototypes';

export const ModelSelectorPrototypesPage = () => {
    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Model selector prototypes')}
                pageDescription={i18n.t('Three exploratory directions for redesigning how users pick a model.')}
            />
            <ModelSelectorPrototypesPlayground />
        </>
    );
};
