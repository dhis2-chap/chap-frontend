import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';

export const HelloPage: React.FC = () => {
    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Hello!')}
            />
        </>
    );
};
