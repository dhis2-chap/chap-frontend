import React from 'react'
import {
    Button,
    ButtonStrip,
    InputField,
    Label,
    SingleSelect,
    SingleSelectOption,
} from '@dhis2/ui'
import i18n from '@dhis2/d2-i18n'
import { Controller } from 'react-hook-form'
import { UserOptionsFields } from '../UserOptionsFields'
import { useFormController, ModelTemplateConfigFormValues } from './hooks/useFormController'
import styles from './ModelTemplateConfigForm.module.css'

interface ModelTemplateConfigFormProps {
    onSubmit: (data: ModelTemplateConfigFormValues) => void
    isSubmitting: boolean
}

export type { ModelTemplateConfigFormValues }

export const ModelTemplateConfigForm = ({
    onSubmit,
    isSubmitting,
}: ModelTemplateConfigFormProps) => {
    const {
        control,
        handleSubmit,
        errors,
        watch,
        setValue,
        fields,
        remove,
        newCovariate,
        setNewCovariate,
        covariateError,
        setCovariateError,
        handleAddCovariate,
        currentTemplate,
        requiredCovariates,
        modelTemplates,
        isLoadingTemplates,
        watchedTemplateId
    } = useFormController()

    const handleFormSubmit = (data: ModelTemplateConfigFormValues) => {
        onSubmit(data)
    }

    return (
        <div className={styles.formContainer}>
            <h2 className={styles.formTitle}>{i18n.t('Configure Model')}</h2>
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <div className={styles.formField}>
                    <Label>{i18n.t('Model Template')}</Label>
                    <Controller
                        name="templateId"
                        control={control}
                        render={({ field }) => (
                            <SingleSelect
                                selected={field.value > 0 ? field.value.toString() : ''}
                                loading={isLoadingTemplates}
                                error={!!errors.templateId}
                                placeholder={i18n.t('Select a model template')}
                                disabled={isLoadingTemplates || !modelTemplates}
                                onChange={({ selected }) => field.onChange(selected ? Number(selected) : 0)}
                            >
                                {modelTemplates?.map(template => (
                                    <SingleSelectOption
                                        key={template.id}
                                        label={template.displayName ?? template.name}
                                        value={template.id.toString()}
                                    />
                                ))}
                            </SingleSelect>
                        )}
                    />
                    {errors.templateId && <p className={styles.errorText}>{errors.templateId.message}</p>}
                </div>

                <div className={styles.formField}>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <InputField
                                label={i18n.t('Configured Model Name')}
                                value={field.value}
                                error={!!errors.name}
                                disabled={!watchedTemplateId}
                                placeholder={i18n.t('Enter something to identify your model, e.g. "Debug" or "Malaria"')}
                                onChange={({ value }) => field.onChange(value)}
                                helpText={field.value ?
                                    i18n.t('Your model will be saved as {{modelName}} [{{configuredModelName}}]',
                                        {
                                            modelName: currentTemplate?.displayName,
                                            configuredModelName: field.value,
                                            escape: ':'
                                        }
                                    ) : undefined
                                }
                            />
                        )}
                    />
                    {errors.name && <p className={styles.errorText}>{errors.name.message}</p>}
                </div>

                <UserOptionsFields
                    control={control}
                    setValue={setValue}
                    currentTemplate={currentTemplate}
                    disabled={!watchedTemplateId}
                />

                <div className={styles.formField}>
                    <Label>{i18n.t('Additional continuous covariates')}</Label>
                    <div className={styles.covariate}>
                        <div className={styles.covariateInput}>
                            <InputField
                                value={newCovariate}
                                placeholder={i18n.t('Enter covariate name')}
                                onKeyDown={(_, event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault()
                                        if (newCovariate.trim()) {
                                            handleAddCovariate()
                                        }
                                    }
                                }}
                                onChange={({ value }) => {
                                    setNewCovariate(value || '')
                                    if (covariateError) {
                                        setCovariateError('')
                                    }
                                }}
                                disabled={!watchedTemplateId}
                                error={!!covariateError}
                            />
                        </div>
                        <Button
                            onClick={handleAddCovariate}
                            disabled={!newCovariate.trim()}
                            type='button'
                        >
                            {i18n.t('Add')}
                        </Button>
                    </div>

                    <div className={styles.covariatesList}>
                        {requiredCovariates.map((covariate, index) => (
                            <div key={`required-${index}`} className={`${styles.covariateItem} ${styles.requiredCovariateItem}`}>
                                <span className={styles.covariateItemText}>
                                    {covariate}
                                </span>
                                <span className={styles.requiredLabel}>{i18n.t('Required')}</span>
                            </div>
                        ))}
                        {fields.map((field, index) => (
                            <div key={field.id} className={styles.covariateItem}>
                                <span className={styles.covariateItemText}>
                                    {watch(`covariates.${index}.name`)}
                                </span>
                                <Button
                                    onClick={() => remove(index)}
                                    small
                                >
                                    {i18n.t('Remove')}
                                </Button>
                            </div>
                        ))}
                    </div>
                    {covariateError && <p className={styles.errorText}>{covariateError}</p>}
                    {errors.covariates && <p className={styles.errorText}>{i18n.t('Please check covariates')}</p>}
                </div>

                <div className={styles.actionButtons}>
                    <ButtonStrip>
                        <Button
                            primary
                            loading={isSubmitting}
                            type="submit"
                        >
                            {i18n.t('Configure Model')}
                        </Button>
                    </ButtonStrip>
                </div>
            </form>
        </div>
    )
}

export default ModelTemplateConfigForm
