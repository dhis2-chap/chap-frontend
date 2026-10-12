import i18n from '@dhis2/d2-i18n';
import { NoticeBox } from '@dhis2/ui';
import { SettingsEditor } from '../components/SettingsEditor';
import { PageHeader } from '../components/PageHeader';

export const SettingsPage = () => (
    <>
        <PageHeader title={i18n.t('Settings')} />
        <SettingsEditor>
            {() => <NoticeBox>{i18n.t('Settings are shared by everyone using the Early Warning App. Configure recommended actions in Interventions and messages in Bulletins.')}</NoticeBox>}
        </SettingsEditor>
    </>
);
