import React from 'react'
import i18n from '@dhis2/d2-i18n'
import { NewEvaluationForm } from '../../components/NewEvaluationForm'
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader'
import { CircularLoader } from '@dhis2/ui'
import { useInitialFormState } from './hooks/useInitialFormState'

export const NewEvaluationPage = () => {
  const { initialValues, isLoading } = useInitialFormState()

  return (
    <div>
      <PageHeader
        pageTitle={i18n.t('New evaluation')}
        pageDescription={i18n.t('Create a new evaluation to assess the performance of a model')}
      />

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <CircularLoader />
        </div>
      ) : (
        <NewEvaluationForm initialValues={initialValues} />
      )}
    </div>
  )
}
