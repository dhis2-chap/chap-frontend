import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import i18n from '@dhis2/d2-i18n'
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader'
import { EvaluationSummary } from '../../components/EvaluationSummary/EvaluationSummary.container'
import { Button, IconArrowLeft16 } from '@dhis2/ui'

export const EvaluationDetailsPage: React.FC = () => {
    const { evaluationId } = useParams<{ evaluationId: string }>()
    const navigate = useNavigate()

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Evaluation details')}
                pageDescription={i18n.t('Inspect a single evaluation and view its visualizations.')}
            />
            <div>
                <Button
                    small
                    icon={<IconArrowLeft16 />}
                    onClick={() => {
                        navigate('/evaluate')
                    }}
                >
                    {i18n.t('Back to evaluations')}
                </Button>
            </div>

            <EvaluationSummary
                evaluationId={evaluationId ? Number(evaluationId) : undefined}
            />
        </>
    )
}


