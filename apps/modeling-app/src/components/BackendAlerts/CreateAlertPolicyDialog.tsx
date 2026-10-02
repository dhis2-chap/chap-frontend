import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    ButtonStrip,
    CircularLoader,
    InputField,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui';
import type { AlertLevel } from '@dhis2-chap/ui';
import { useAlertThresholdSchema } from '@/hooks/useAlertThresholdSchema';
import { useCreateAlertPolicy } from '@/hooks/useAlertPolicies';
import {
    thresholdParameterDefaults,
    thresholdParameterValidator,
    type ThresholdStrategySchema,
} from '@/utils/thresholdParameterSchema';
import { getChapErrorMessage } from '@/utils/chapErrors';
import styles from './BackendAlerts.module.css';

type Props = { onClose: () => void; onCreated: (id: number) => void };

const PolicyForm = ({
    strategies,
    onClose,
    onCreated,
}: Props & { strategies: ThresholdStrategySchema[] }) => {
    const [strategy, setStrategy] = useState(strategies[0]);
    const create = useCreateAlertPolicy();
    const schema = z.object({
        name: z.string().trim().min(1, i18n.t('Enter a policy name')),
        level: z.string().trim().min(1, i18n.t('Enter a level name')),
        probability: z
            .string()
            .trim()
            .min(1, i18n.t('Enter a probability'))
            .transform(Number)
            .pipe(
                z
                    .number()
                    .finite()
                    .min(0, i18n.t('Enter a fraction between 0 and 1'))
                    .max(1, i18n.t('Enter a fraction between 0 and 1')),
            ),
        params: thresholdParameterValidator(strategy),
    });
    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            level: '',
            probability: '0.5',
            params: {
                type: strategy.id,
                ...thresholdParameterDefaults(strategy),
            },
        },
    });
    const save = handleSubmit(async (values) => {
        try {
            const result = await create.mutateAsync({
                name: values.name,
                levels: [
                    {
                        name: values.level,
                        exceedanceThreshold: values.probability,
                        // Validated against this server's oneOf above, which may include
                        // strategies newer than the generated client's static union.
                        thresholdParams: values.params as AlertLevel['thresholdParams'],
                    },
                ],
            });
            onCreated(result.id);
        } catch {
            // Keep the form open and display the API error, including 422 details.
        }
    });

    return (
        <>
            <ModalContent>
                <div className={styles.content}>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <InputField
                                name={field.name}
                                label={i18n.t('Policy name')}
                                required
                                value={field.value}
                                onChange={({ value }) => field.onChange(value ?? '')}
                                error={!!errors.name}
                                validationText={errors.name?.message}
                                disabled={create.isPending}
                            />
                        )}
                    />
                    <Controller
                        name="level"
                        control={control}
                        render={({ field }) => (
                            <InputField
                                name={field.name}
                                label={i18n.t('Alert level name')}
                                required
                                value={field.value}
                                onChange={({ value }) => field.onChange(value ?? '')}
                                error={!!errors.level}
                                validationText={errors.level?.message}
                                disabled={create.isPending}
                            />
                        )}
                    />
                    <SingleSelectField
                        label={i18n.t('Threshold strategy')}
                        selected={strategy.id}
                        helpText={strategy.description}
                        disabled={create.isPending}
                        onChange={({ selected }) => {
                            const next = strategies.find(item => item.id === selected);
                            if (!next) return;
                            setStrategy(next);
                            setValue('params', {
                                type: next.id,
                                ...thresholdParameterDefaults(next),
                            });
                        }}
                    >
                        {strategies.map(item => (
                            <SingleSelectOption key={item.id} value={item.id} label={item.label} />
                        ))}
                    </SingleSelectField>
                    {strategy.fields.map(parameter => (
                        <Controller
                            key={`${strategy.id}-${parameter.name}`}
                            name={`params.${parameter.name}`}
                            control={control}
                            render={({ field, fieldState }) =>
                                parameter.options || parameter.type === 'boolean' ? (
                                    <SingleSelectField
                                        label={parameter.label}
                                        helpText={parameter.description}
                                        selected={String(field.value ?? '')}
                                        disabled={create.isPending}
                                        onChange={({ selected }) => field.onChange(selected)}
                                        error={!!fieldState.error}
                                        validationText={fieldState.error?.message}
                                    >
                                        {(parameter.options ?? ['true', 'false']).map(option => (
                                            <SingleSelectOption
                                                key={option}
                                                value={option}
                                                label={option}
                                            />
                                        ))}
                                    </SingleSelectField>
                                ) : (
                                    <InputField
                                        name={field.name}
                                        label={parameter.label}
                                        helpText={parameter.description}
                                        type={parameter.type === 'string' ? 'text' : 'number'}
                                        value={String(field.value ?? '')}
                                        onChange={({ value }) => field.onChange(value ?? '')}
                                        min={parameter.minimum?.toString()}
                                        max={parameter.maximum?.toString()}
                                        step={parameter.type === 'integer' ? '1' : 'any'}
                                        disabled={create.isPending}
                                        error={!!fieldState.error}
                                        validationText={fieldState.error?.message}
                                    />
                                )}
                        />
                    ))}
                    <Controller
                        name="probability"
                        control={control}
                        render={({ field }) => (
                            <InputField
                                name={field.name}
                                label={i18n.t('Exceedance probability cut')}
                                helpText={i18n.t(
                                    'Enter a fraction between 0 and 1. Each alert level uses one threshold line.',
                                )}
                                type="number"
                                min="0"
                                max="1"
                                step="any"
                                value={field.value}
                                onChange={({ value }) => field.onChange(value ?? '')}
                                disabled={create.isPending}
                                error={!!errors.probability}
                                validationText={errors.probability?.message}
                            />
                        )}
                    />
                    {create.error && (
                        <NoticeBox error title={i18n.t('Unable to create alert policy')}>
                            {getChapErrorMessage(create.error)}
                        </NoticeBox>
                    )}
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button onClick={onClose} disabled={create.isPending}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        onClick={() => save()}
                        loading={create.isPending}
                        disabled={create.isPending}
                    >
                        {i18n.t('Create policy')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </>
    );
};

export const CreateAlertPolicyDialog = (props: Props) => {
    const schema = useAlertThresholdSchema();
    return (
        <Modal dataTest="create-alert-policy-dialog">
            <ModalTitle>{i18n.t('Create alert policy')}</ModalTitle>
            {schema.isLoading && (
                <ModalContent>
                    <CircularLoader small />
                </ModalContent>
            )}
            {schema.isError && (
                <ModalContent>
                    <NoticeBox error title={i18n.t('Unable to load threshold schema')}>
                        {getChapErrorMessage(schema.error as Error)}
                    </NoticeBox>
                    <Button onClick={() => schema.refetch()}>{i18n.t('Retry')}</Button>
                </ModalContent>
            )}
            {schema.data && <PolicyForm {...props} strategies={schema.data} />}
            {!schema.data && (
                <ModalActions>
                    <Button onClick={props.onClose}>{i18n.t('Cancel')}</Button>
                </ModalActions>
            )}
        </Modal>
    );
};
