import { useRef, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { useDataEngine } from '@dhis2/app-runtime';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assertDataValueSetImportAccepted, type ForecastDataValue } from '@dhis2-chap/core';
import { AlertApproval, AlertsService, type AlertRead } from '@dhis2-chap/ui';
import { runReviewTasks, type ReviewStep, type ReviewTask, type StepStatus } from '../utils/reviewSubmission';

export type SubmitReviewInput = {
    reviewer: string;
    accepted: AlertRead[];
    declined: AlertRead[];
    dataValues: ForecastDataValue[];
    clearValues?: Omit<ForecastDataValue, 'value'>[];
    afterImport?: () => Promise<unknown>;
};

export const useSubmitReview = () => {
    const engine = useDataEngine();
    const queryClient = useQueryClient();
    const completed = useRef(new Set<string>());
    const writesStarted = useRef(false);
    const inputRef = useRef<SubmitReviewInput>();
    const [steps, setSteps] = useState<Partial<Record<ReviewStep, StepStatus>>>({});
    const mutation = useMutation<void, Error, SubmitReviewInput>({
        mutationFn: async (input) => {
            if (inputRef.current && inputRef.current !== input) throw Error(i18n.t('Finish the current submission before starting another.'));
            if (!input.reviewer.trim()) throw Error(i18n.t('Unable to identify the current reviewer.'));
            inputRef.current = input;
            const { accepted, declined, reviewer, dataValues } = input;
            const importValues = async (dryRun: boolean) => assertDataValueSetImportAccepted(await engine.mutate({
                resource: 'dataValueSets', type: 'create', params: { dryRun }, data: { dataValues },
            }), { allowIgnored: false });
            const clearValues = input.clearValues ?? [];
            const clearIndicators = async (dryRun: boolean) => assertDataValueSetImportAccepted(await engine.mutate({
                resource: 'dataValueSets', type: 'create', params: { dryRun, importStrategy: 'DELETE' }, data: { dataValues: clearValues },
            }), { allowIgnored: false });
            const tasks: ReviewTask[] = [];
            if (dataValues.length) tasks.push({ id: 'validate', step: 'validateImport', run: () => importValues(true) });
            if (clearValues.length) tasks.push({ id: 'validateClear', step: 'validateImport', run: () => clearIndicators(true) });
            for (const [id, alerts, approved] of [
                ['accept', accepted, AlertApproval.APPROVED],
                ['decline', declined, AlertApproval.DECLINED],
            ] as const) {
                if (alerts.length) tasks.push({ id, step: 'recordDecisions', run: () => AlertsService.approveAlertsV1CrudAlertsApprovePost({ alertIds: alerts.map(alert => alert.id), approved, approvedBy: reviewer }) });
            }
            if (dataValues.length) tasks.push({ id: 'import', step: 'importForecast', run: () => importValues(false) });
            if (clearValues.length) tasks.push({ id: 'clear', step: 'importForecast', run: () => clearIndicators(false) });
            if (input.afterImport) tasks.push({ id: 'saveImport', step: 'saveImport', run: input.afterImport });
            await runReviewTasks(tasks, completed.current, (step, status) => {
                if (step !== 'validateImport' && status === 'running') writesStarted.current = true;
                setSteps(current => ({ ...current, [step]: status }));
            });
        },
        onSettled: () => queryClient.invalidateQueries(['alerts']),
    });
    return {
        ...mutation,
        steps,
        hasWritten: writesStarted.current,
        reset: () => {
            mutation.reset();
            completed.current.clear();
            writesStarted.current = false;
            inputRef.current = undefined;
            setSteps({});
        },
    };
};
