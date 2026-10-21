import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    ButtonStrip,
    IconAdd16,
    IconDelete16,
    InputField,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui';
import {
    DEFAULT_OUTBREAK_PROBABILITY,
    OUTBREAK_PROBABILITY_OPTIONS,
    sortAlertLevels,
    type AlertLevel,
} from '@dhis2-chap/ui';
import { useCreateAlertPolicy } from '@/hooks/useAlertPolicies';
import { useThresholdStrategies } from '@/hooks/useThresholdStrategies';
import { getChapErrorMessage } from '@/utils/chapErrors';
import { useSaveAlertPolicyDisplay } from '@/hooks/useAlertPolicyDisplay';
import { alertColorSchema } from './alertLevelDisplay';
import { AlertColorSelect } from './AlertColorSelect';
import styles from './BackendAlerts.module.css';

const isNumberIn = (value: string, min: number, max: number) => (
    value.trim() !== '' && Number(value) >= min && Number(value) <= max
);

const levelSchema = z.object({
    name: z.string().trim().min(1, i18n.t('Enter a level name')),
    color: alertColorSchema,
    strategy: z.enum(['seasonal', 'percentile']),
    value: z.string(),
    baselineYears: z.string(),
    probability: z.string(),
}).superRefine((level, ctx) => {
    if (level.strategy === 'seasonal' && !isNumberIn(level.value, 0, Infinity)) {
        ctx.addIssue({ code: 'custom', path: ['value'], message: i18n.t('Enter zero or more') });
    }
    if (level.strategy === 'percentile' && !isNumberIn(level.value, 0, 100)) {
        ctx.addIssue({ code: 'custom', path: ['value'], message: i18n.t('Enter a percentile between 0 and 100') });
    }
    const years = level.baselineYears.trim();
    if (level.strategy === 'percentile' && years && !(Number.isInteger(Number(years)) && Number(years) >= 1)) {
        ctx.addIssue({ code: 'custom', path: ['baselineYears'], message: i18n.t('Enter a whole number of years') });
    }
});

const formSchema = z.object({
    name: z.string().trim().min(1, i18n.t('Enter a policy name')),
    levels: z.array(levelSchema).min(1),
}).superRefine(({ levels }, ctx) => {
    levels.forEach((level, index) => {
        if (levels.findIndex(other => other.name.trim() === level.name.trim()) !== index) {
            ctx.addIssue({ code: 'custom', path: ['levels', index, 'name'], message: i18n.t('Level names must be unique') });
        }
    });
});

type FormValues = z.infer<typeof formSchema>;
type LevelValues = FormValues['levels'][number];

// Matches the backend defaults: mean + 2 SD, or the WHO 75th percentile.
const DEFAULT_VALUE = { seasonal: '2', percentile: '75' };

const NEW_LEVEL: LevelValues = {
    name: '',
    color: 'red',
    strategy: 'seasonal',
    value: DEFAULT_VALUE.seasonal,
    baselineYears: '5',
    probability: String(DEFAULT_OUTBREAK_PROBABILITY),
};

const toAlertLevel = (level: LevelValues): AlertLevel => ({
    name: level.name.trim(),
    exceedanceThreshold: Number(level.probability) / 100,
    thresholdParams: level.strategy === 'seasonal'
        ? { type: 'seasonal', stdMultiplier: Number(level.value) }
        : {
                type: 'percentile',
                quantile: Number(level.value) / 100,
                baselineYears: level.baselineYears.trim() ? Number(level.baselineYears) : null,
            },
});

export const CreateAlertPolicyModal = ({ onClose }: { onClose: () => void }) => {
    const create = useCreateAlertPolicy();
    const saveDisplay = useSaveAlertPolicyDisplay();
    const [createdPolicyId, setCreatedPolicyId] = useState<number>();
    const isSaving = create.isLoading || saveDisplay.isLoading;
    // Once created, only the colour save can be retried.
    const isLocked = isSaving || createdPolicyId !== undefined;
    const { thresholdStrategies, isLoading: isStrategiesLoading } = useThresholdStrategies();
    const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            levels: [NEW_LEVEL],
        },
    });
    const { fields, append, remove } = useFieldArray({ control, name: 'levels' });
    const levels = watch('levels');

    // A failed colour save must not create a second policy when retried.
    const save = handleSubmit(async (values) => {
        try {
            let policyId = createdPolicyId;
            if (policyId === undefined) {
                const result = await create.mutateAsync({
                    name: values.name.trim(),
                    levels: sortAlertLevels(values.levels.map(toAlertLevel)),
                });
                policyId = result.id;
                setCreatedPolicyId(policyId);
            }
            await saveDisplay.mutateAsync({
                policyId,
                display: Object.fromEntries(values.levels.map(level => [level.name.trim(), { color: level.color }])),
            });
            onClose();
        } catch {
            // Mutation errors are rendered below; keep the form available for retry.
        }
    });

    return (
        <Modal large onClose={onClose} dataTest="create-alert-policy-modal">
            <ModalTitle>{i18n.t('New alert policy')}</ModalTitle>
            <ModalContent>
                <fieldset className={styles.form} disabled={isLocked}>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <InputField
                                name={field.name}
                                label={i18n.t('Policy name')}
                                value={field.value}
                                onChange={({ value }) => field.onChange(value ?? '')}
                                error={!!errors.name}
                                validationText={errors.name?.message}
                            />
                        )}
                    />
                    <p className={styles.help}>
                        {i18n.t('Levels are saved from least to most strict, where a higher minimum probability is stricter. A level fires when the forecast probability of exceeding its threshold reaches the minimum probability.')}
                    </p>
                    {fields.map((field, index) => {
                        const strategy = levels[index]?.strategy;
                        const levelErrors = errors.levels?.[index];
                        return (
                            <div key={field.id} className={styles.policyLevelRow}>
                                <Controller
                                    name={`levels.${index}.name`}
                                    control={control}
                                    render={({ field: input }) => (
                                        <InputField
                                            dense
                                            label={i18n.t('Level name')}
                                            placeholder={i18n.t('e.g. Monitor')}
                                            name={input.name}
                                            value={input.value}
                                            onChange={({ value }) => input.onChange(value ?? '')}
                                            error={!!levelErrors?.name}
                                            validationText={levelErrors?.name?.message}
                                        />
                                    )}
                                />
                                <Controller
                                    name={`levels.${index}.color`}
                                    control={control}
                                    render={({ field: input }) => (
                                        <AlertColorSelect value={input.value} onChange={input.onChange} disabled={isLocked} />
                                    )}
                                />
                                <Controller
                                    name={`levels.${index}.strategy`}
                                    control={control}
                                    render={({ field: input }) => (
                                        <SingleSelectField
                                            dense
                                            label={i18n.t('Strategy')}
                                            loading={isStrategiesLoading}
                                            disabled={isLocked}
                                            // An unmatched selected value makes SingleSelect throw in dev builds.
                                            selected={thresholdStrategies?.some(item => item.id === input.value) ? input.value : undefined}
                                            onChange={({ selected }) => {
                                                input.onChange(selected);
                                                setValue(`levels.${index}.value`, DEFAULT_VALUE[selected as LevelValues['strategy']]);
                                            }}
                                        >
                                            {thresholdStrategies?.map(item => (
                                                <SingleSelectOption key={item.id} value={item.id} label={item.displayName} />
                                            ))}
                                        </SingleSelectField>
                                    )}
                                />
                                <Controller
                                    name={`levels.${index}.value`}
                                    control={control}
                                    render={({ field: input }) => (
                                        <InputField
                                            dense
                                            type="number"
                                            label={strategy === 'percentile'
                                                ? i18n.t('Percentile (%)')
                                                : i18n.t('SD above mean')}
                                            name={input.name}
                                            value={input.value}
                                            onChange={({ value }) => input.onChange(value ?? '')}
                                            error={!!levelErrors?.value}
                                            validationText={levelErrors?.value?.message}
                                        />
                                    )}
                                />
                                {strategy === 'percentile' && (
                                    <Controller
                                        name={`levels.${index}.baselineYears`}
                                        control={control}
                                        render={({ field: input }) => (
                                            <InputField
                                                dense
                                                type="number"
                                                label={i18n.t('Baseline years')}
                                                placeholder={i18n.t('All history')}
                                                name={input.name}
                                                value={input.value}
                                                onChange={({ value }) => input.onChange(value ?? '')}
                                                error={!!levelErrors?.baselineYears}
                                                validationText={levelErrors?.baselineYears?.message}
                                            />
                                        )}
                                    />
                                )}
                                <Controller
                                    name={`levels.${index}.probability`}
                                    control={control}
                                    render={({ field: input }) => (
                                        <SingleSelectField
                                            dense
                                            label={i18n.t('Min. probability')}
                                            disabled={isLocked}
                                            selected={input.value}
                                            onChange={({ selected }) => input.onChange(selected)}
                                        >
                                            {OUTBREAK_PROBABILITY_OPTIONS.map(probability => (
                                                <SingleSelectOption
                                                    key={probability}
                                                    value={String(probability)}
                                                    label={`${probability}%`}
                                                />
                                            ))}
                                        </SingleSelectField>
                                    )}
                                />
                                <Button
                                    small
                                    secondary
                                    icon={<IconDelete16 />}
                                    title={i18n.t('Remove level')}
                                    disabled={fields.length === 1}
                                    onClick={() => remove(index)}
                                />
                            </div>
                        );
                    })}
                    <div>
                        <Button small secondary icon={<IconAdd16 />} onClick={() => append(NEW_LEVEL)}>
                            {i18n.t('Add level')}
                        </Button>
                    </div>
                    {!!saveDisplay.error && (
                        <NoticeBox error title={i18n.t('Policy created, but colours could not be saved')}>
                            {i18n.t('Retry to save the colours. The policy has already been created.')}
                        </NoticeBox>
                    )}
                    {create.error && (
                        <NoticeBox error title={i18n.t('Unable to create alert policy')}>
                            {getChapErrorMessage(create.error)}
                        </NoticeBox>
                    )}
                </fieldset>
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose} disabled={isSaving}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button primary onClick={() => save()} loading={isSaving} disabled={isSaving}>
                        {createdPolicyId === undefined ? i18n.t('Create policy') : i18n.t('Retry saving colours')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
