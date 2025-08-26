import React from 'react'
import { PageHeader } from '../common-features/PageHeader/PageHeader'
import { useModelTemplates } from '../../hooks/useModelTemplates'
import { useRoute } from '../../hooks/useRoute'
import { Button, CircularLoader, IconArrowLeft16 } from '@dhis2/ui'
import i18n from '@dhis2/d2-i18n'
import styles from './ModelTemplatesOverview.module.css'
import ModelTemplateConfigForm, { ModelTemplateConfigFormValues } from './components/ModelTemplateConfigForm/ModelTemplateConfigForm'
import { useConfiguredModels } from './hooks/useConfiguredModels'
import { useNavigate } from 'react-router-dom'

export const ModelTemplatesOverview = () => {
    const { route } = useRoute()
    const { modelTemplates, error, isLoading: isLoadingTemplates } = useModelTemplates({ route })
    const { mutate: configureModel, isLoading: isSubmitting } = useConfiguredModels()
    const navigate = useNavigate()

    const handleSubmit = (data: ModelTemplateConfigFormValues) => {
        configureModel(data)
    }

    const renderContent = () => {
        if (isLoadingTemplates) {
            return (
                <div className={styles.loadingContainer}>
                    <CircularLoader />
                </div>
            )
        }

        if (error) {
            return (
                <div className={styles.errorContainer}>
                    <p>{i18n.t('Error loading model templates:')}</p>
                    <p>{error instanceof Error ? error.message : i18n.t('Unknown error')}</p>
                </div>
            )
        }

        if (!modelTemplates || modelTemplates.length === 0) {
            return (
                <div className={styles.emptyContainer}>
                    <p>{i18n.t('No model templates found.')}</p>
                </div>
            )
        }

        return (
            <div>
                <ModelTemplateConfigForm
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            </div>
        )
    }

    return (
        <div>
            <PageHeader
                pageTitle={i18n.t("Model Templates")}
                pageDescription={i18n.t("Configure new models based on generic model templates")}
            />

            <Button
                onClick={() => navigate('/settings')}
                small
                icon={<IconArrowLeft16 />}
                className={styles.backButton}
            >
                {i18n.t('Back to settings')}
            </Button>
            
            {renderContent()}
        </div>
    )
}

export default ModelTemplatesOverview
