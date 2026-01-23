import { ModelsPageTabs } from './ModelsPageTabs';
import { ConfiguredModelsContent } from './ConfiguredModelsContent';
import { ModelTemplatesContent } from './ModelTemplatesContent';
import { useModelsPageTab } from './hooks/useModelsPageTab';
import styles from './ModelsContent.module.css';

export const ModelsContent = () => {
    const { isConfiguredTab, isTemplatesTab } = useModelsPageTab();

    return (
        <div className={styles.container}>
            <div className={styles.tabsWrapper}>
                <ModelsPageTabs />
            </div>
            {isConfiguredTab && <ConfiguredModelsContent />}
            {isTemplatesTab && <ModelTemplatesContent />}
        </div>
    );
};
