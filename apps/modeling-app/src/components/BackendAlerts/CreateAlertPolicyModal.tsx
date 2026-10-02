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
    type AlertLevel,
} from '@dhis2-chap/ui';
import { useCreateAlertPolicy } from '@/hooks/useAlertPolicies';
import { useThresholdStrategies } from '@/hooks/useThresholdStrategies';
import { getChapErrorMessage } from '@/utils/chapErrors';
import styles from './BackendAlerts.module.css';

const isNumberIn = (value: string, min: number, max: number) => (
    value.trim() !== '' && Number(value) >= min && Number(value) <= max
);

const levelSchema = z.object({
    name: z.string().trim().min(1, i18n.t('Enter a level name')),
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
    strategy: 'seasonal',
    value: '2',
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
    const { thresholdStrategies, isLoading: isStrategiesLoading } = useThresholdStrategies();
    const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: '', levels: [NEW_LEVEL] },
    });
    const { fields, append, remove } = useFieldArray({ control, name: 'levels' });
    const levels = watch('levels');

    const save = handleSubmit(async (values) => {
        try {
            await create.mutateAsync({ name: values.name.trim(), levels: values.levels.map(toAlertLevel) });
            onClose();
        } catch {
            // The mutation error is shown below and the form stays open for a retry.
        }
    });

    return (
        <Modal large onClose={onClose} dataTest="create-alert-policy-modal">
            <ModalTitle>{i18n.t('New alert policy')}</ModalTitle>
            <ModalContent>
                <div className={styles.form}>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <InputField
                                label={i18n.t('Policy name')}
                                value={field.value}
                                onChange={({ value }) => field.onChange(value ?? '')}
                                error={!!errors.name}
                                validationText={errors.name?.message}
                            />
                        )}
                    />
                    <p className={styles.help}>
                        {i18n.t('Add levels from least to most severe. A level fires when the forecast probability of exceeding its threshold reaches the minimum probability.')}
                    </p>
                    {fields.map((field, index) => {
                        const strategy = levels[index]?.strategy;
                        const levelErrors = errors.levels?.[index];
                        return (
                            <div key={field.id} className={styles.levelRow}>
                                <Controller
                                    name={`levels.${index}.name`}
                                    control={control}
                                    render={({ field: input }) => (
                                        <InputField
                                            dense
                                            label={i18n.t('Level name')}
                                            placeholder={i18n.t('e.g. Monitor')}
                                            value={input.value}
                                            onChange={({ value }) => input.onChange(value ?? '')}
                                            error={!!levelErrors?.name}
                                            validationText={levelErrors?.name?.message}
                                        />
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
                    {create.error && (
                        <NoticeBox error title={i18n.t('Unable to create alert policy')}>
                            {getChapErrorMessage(create.error)}
                        </NoticeBox>
                    )}
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose} disabled={create.isLoading}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button primary onClick={() => save()} loading={create.isLoading}>
                        {i18n.t('Create policy')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
