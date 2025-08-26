import React from 'react'
import i18n from '@dhis2/d2-i18n'
import { NewEvaluationForm } from '../../components/NewEvaluationForm'
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader'

export const NewEvaluationPage = () => {
  return (
    <div>
      <PageHeader
        pageTitle={i18n.t('New evaluation')}
        pageDescription={i18n.t('Create a new evaluation to assess the performance of a model')}
      />

      <NewEvaluationForm />
    </div>
  )
}
