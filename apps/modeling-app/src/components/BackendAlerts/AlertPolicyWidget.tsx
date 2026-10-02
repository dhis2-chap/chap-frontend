import { useEffect, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import { Widget, type PredictionSetupReadWithPredictions } from '@dhis2-chap/ui';
import { useAlertPolicies } from '@/hooks/useAlertPolicies';
import { useUpdatePredictionSetup } from '../PageContent/ConfiguredModelDashboard/QuickActionsWidget/hooks/useUpdatePredictionSetup';
import { parameterLabel } from '@/utils/thresholdParameterSchema';
import { getChapErrorMessage } from '@/utils/chapErrors';
import { CreateAlertPolicyDialog } from './CreateAlertPolicyDialog';
import styles from './BackendAlerts.module.css';

export const AlertPolicyWidget = ({ setup }: { setup: PredictionSetupReadWithPredictions }) => {
    const policies = useAlertPolicies();
    const [selected, setSelected] = useState(String(setup.alertPolicy?.id ?? ''));
    const [creating, setCreating] = useState(false);
    const { updatePredictionSetup, isUpdating, error } = useUpdatePredictionSetup();
    useEffect(
        () => setSelected(String(setup.alertPolicy?.id ?? '')),
        [setup.id, setup.alertPolicy?.id],
    );
    const policy = policies.data?.find(item => String(item.id) === selected);
    const save = async () => {
        if (!policy) return;
        try {
            await updatePredictionSetup({
                predictionSetupId: setup.id,
                data: { alertPolicyId: policy.id },
            });
        } catch {
            // The mutation reports failure and the selected policy remains available for retry.
        }
    };
    return (
        <Widget header={i18n.t('Alert policy')} noncollapsible>
            <div className={styles.content}>
                {policies.isLoading && <CircularLoader small />}
                {policies.isError && (
                    <NoticeBox error title={i18n.t('Unable to load alert policies')}>
                        {getChapErrorMessage(policies.error as Error)}
                        <Button small onClick={() => policies.refetch()}>
                            {i18n.t('Retry')}
                        </Button>
                    </NoticeBox>
                )}
                {policies.data && (
                    <>
                        <SingleSelectField
                            label={i18n.t('Saved policy')}
                            selected={policy ? selected : undefined}
                            placeholder={i18n.t('Select an alert policy')}
                            disabled={isUpdating}
                            onChange={({ selected: value }) => setSelected(value)}
                        >
                            {policies.data.map(item => (
                                <SingleSelectOption
                                    key={item.id}
                                    value={String(item.id)}
                                    label={item.name}
                                />
                            ))}
                        </SingleSelectField>
                        {policy?.levels?.map(level => (
                            <div key={level.name} className={styles.level}>
                                <strong>{level.name}</strong>
                                <span>
                                    {i18n.t('Strategy{{colon}} {{strategy}}', {
                                        colon: ':',
                                        strategy: level.thresholdParams.type,
                                    })}
                                </span>
                                {Object.entries(level.thresholdParams)
                                    .filter(([name]) => name !== 'type')
                                    .map(([name, value]) => (
                                        <span key={name}>
                                            {i18n.t('{{parameter}}{{colon}} {{value}}', {
                                                parameter: parameterLabel(name),
                                                colon: ':',
                                                value:
                                                    value === null
                                                        ? i18n.t('All available history')
                                                        : String(value),
                                            })}
                                        </span>
                                    ))}
                                <span>
                                    {i18n.t('Probability cut{{colon}} {{probability}}', {
                                        colon: ':',
                                        probability: `${level.exceedanceThreshold * 100}%`,
                                    })}
                                </span>
                            </div>
                        ))}
                        <Button
                            small
                            primary
                            disabled={!policy || policy.id === setup.alertPolicy?.id || isUpdating}
                            loading={isUpdating}
                            onClick={save}
                        >
                            {i18n.t('Use policy for this setup')}
                        </Button>
                        <Button small disabled={isUpdating} onClick={() => setCreating(true)}>
                            {i18n.t('Create policy')}
                        </Button>
                        {error && (
                            <NoticeBox error title={i18n.t('Unable to save alert policy')}>
                                {getChapErrorMessage(error)}
                            </NoticeBox>
                        )}
                    </>
                )}
            </div>
            {creating && (
                <CreateAlertPolicyDialog
                    onClose={() => setCreating(false)}
                    onCreated={(id) => {
                        setSelected(String(id));
                        setCreating(false);
                    }}
                />
            )}
        </Widget>
    );
};
