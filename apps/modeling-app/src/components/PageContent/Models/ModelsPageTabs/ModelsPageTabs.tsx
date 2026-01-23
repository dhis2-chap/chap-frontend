import { TabBar, Tab, IconQuestion16, Tooltip } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useModelsPageTab, type ModelsPageTab } from '../hooks/useModelsPageTab';
import styles from './ModelsPageTabs.module.css';

export const ModelsPageTabs = () => {
    const { tab, setTab } = useModelsPageTab();

    const handleTabClick = (selectedTab: ModelsPageTab) => {
        setTab(selectedTab);
    };

    return (
        <TabBar className={styles.tabBar}>
            <Tab className={styles.tab} selected={tab === 'configured'} onClick={() => handleTabClick('configured')}>
                {i18n.t('Configured Models')}
                <Tooltip content={i18n.t('Variants of a model template')}>
                    <IconQuestion16 />
                </Tooltip>
            </Tab>
            <Tab className={styles.tab} selected={tab === 'templates'} onClick={() => handleTabClick('templates')}>
                {i18n.t('Model Templates')}
                <Tooltip content={i18n.t('Base models ')}>
                    <IconQuestion16 />
                </Tooltip>
            </Tab>
        </TabBar>
    );
};
