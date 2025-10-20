import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, IconArrowLeft16 } from '@dhis2/ui';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { NewConfiguredModelContent } from '../../components/PageContent/NewConfiguredModel';
import styles from './NewConfiguredModelPage.module.css';

export const NewConfiguredModelPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('New model')}
                pageDescription={i18n.t('Configure a new model with custom settings or parameters based on a model template.')}
            />
            <div className={styles.backButton}>
                <Button
                    small
                    icon={<IconArrowLeft16 />}
                    onClick={() => navigate('/models')}
                >
                    {i18n.t('Back to models')}
                </Button>
            </div>
            <NewConfiguredModelContent />
        </>
    );
};
