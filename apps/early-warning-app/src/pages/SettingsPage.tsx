import i18n from '@dhis2/d2-i18n';
import { RouteSettings } from '@dhis2-chap/ui';
import { PageHeader } from '../components/PageHeader';

export const SettingsPage = () => (
    <>
        <PageHeader title={i18n.t('Settings')} />
        <RouteSettings />
    </>
);
