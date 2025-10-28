import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { useParams } from 'react-router-dom';
import * as z from 'zod';
import { NoticeBox } from '@dhis2/ui';
import { EvaluationDetailsComponent } from './EvaluationDetails.component';

const paramSchema = z.object({
    evaluationId: z.string().transform(val => Number(val)),
});

export const EvaluationDetails: React.FC = () => {
    const params = useParams();
    const { data, error } = paramSchema.safeParse(params);

    if (error) {
        console.error('EvaluationDetails: invalid evaluation ID', {
            error,
            params,
        });
        return (
            <div>
                <NoticeBox title={i18n.t('Invalid evaluation ID')} error>
                    <p>{i18n.t('The evaluation ID is invalid. Please try again.')}</p>
                </NoticeBox>
            </div>
        );
    }
    const { evaluationId } = data;

    return (
        <EvaluationDetailsComponent
            evaluationId={evaluationId}
        />
    );
};
