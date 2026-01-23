import { TabBar, Tab } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useModelsPageTab, type ModelsPageTab } from '../hooks/useModelsPageTab';

export const ModelsPageTabs = () => {
    const { tab, setTab } = useModelsPageTab();

    const handleTabClick = (selectedTab: ModelsPageTab) => () => {
        setTab(selectedTab);
    };

    return (
        <TabBar>
            <Tab selected={tab === 'configured'} onClick={handleTabClick('configured')}>
                {i18n.t('Configured Models')}
            </Tab>
            <Tab selected={tab === 'templates'} onClick={handleTabClick('templates')}>
                {i18n.t('Model Templates')}
            </Tab>
        </TabBar>
    );
};
