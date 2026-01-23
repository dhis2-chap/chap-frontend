import { NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './ModelTemplatesPlaceholder.module.css';

export const ModelTemplatesPlaceholder = () => {
    return (
        <div className={styles.container}>
            <NoticeBox title={i18n.t('Coming Soon')}>
                {i18n.t('Model templates functionality will be available in a future release.')}
            </NoticeBox>
        </div>
    );
};
