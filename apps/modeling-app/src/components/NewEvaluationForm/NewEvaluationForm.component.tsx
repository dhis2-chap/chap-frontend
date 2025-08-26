import React from 'react'
import { type UseFormReturn } from 'react-hook-form'
import styles from './NewEvaluationForm.module.css'
import { PeriodSelector } from './Sections/PeriodSelector'
import { NameInput } from './Sections/NameInput'
import { LocationSelector } from './Sections/LocationSelector'
import { ModelSelector } from './Sections/ModelSelector/ModelSelector'
import { DatasetConfiguration } from './Sections/DatasetConfiguration'
import { OrganisationUnit } from '../OrganisationUnitSelector'
import { EvaluationFormValues } from './hooks/useFormController'

type Props = {
    onSubmit: (data: EvaluationFormValues) => void
    methods: UseFormReturn<EvaluationFormValues>
    onUpdateOrgUnits: (orgUnits: OrganisationUnit[]) => void
}

export const NewEvaluationFormComponent = ({
    onSubmit,
    methods,
    onUpdateOrgUnits,
}: Props) => {
    const handleFormSubmit = (data: EvaluationFormValues) => {
        onSubmit(data)
    }

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = methods

    return (
        <>
            <div className={styles.formWrapper}>
                <form onSubmit={handleSubmit(handleFormSubmit)}>
                    <NameInput
                        control={control}
                        errors={errors}
                    />

                    <PeriodSelector
                        control={control}
                        errors={errors}
                    />

                    <LocationSelector
                        control={control}
                        errors={errors}
                        onUpdateOrgUnits={onUpdateOrgUnits}
                    />

                    <ModelSelector
                        control={control}
                    />

                    <DatasetConfiguration
                        control={control}
                        errors={errors}
                    />
                </form>
            </div>
        </>
    )
}
