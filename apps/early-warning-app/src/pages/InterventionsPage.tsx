import { useDataEngine } from '@dhis2/app-runtime';
import { useQuery } from '@tanstack/react-query';
import { Button, InputField, NoticeBox, SingleSelectField, SingleSelectOption, TextAreaField } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '../components/PageHeader';
import { SettingsEditor } from '../components/SettingsEditor';
import styles from '../components/SettingsEditor.module.css';

export const InterventionsPage = () => {
    const engine = useDataEngine();
    const { data: levels, error, isLoading } = useQuery({
        queryKey: ['early-warning', 'org-unit-levels'],
        queryFn: async () => {
            const response = await engine.query({ levels: { resource: 'organisationUnitLevels', params: {
                fields: 'level,displayName', paging: false, order: 'level:asc',
            } } });
            return (response.levels as { organisationUnitLevels: { level: number; displayName: string }[] }).organisationUnitLevels;
        },
        staleTime: Infinity,
    });
    return (
        <>
            <PageHeader title={i18n.t('Interventions')} />
            {error && <NoticeBox error>{i18n.t('Could not load organisation unit levels.')}</NoticeBox>}
            <SettingsEditor validate={settings => settings.interventions.some(item => !item.orgUnitLevel || !item.alertLevel.trim() || !item.action.trim())
                ? i18n.t('Choose an organisation unit level and provide an alert level and recommended action.') : undefined}
            >
                {(settings, update, disabled) => {
                    const updateItem = (index: number, patch: Partial<(typeof settings.interventions)[number]>) => update({
                        interventions: settings.interventions.map((item, position) => position === index ? { ...item, ...patch } : item),
                    });
                    return (
                        <>
                            <p>{i18n.t('Recommended actions are matched by organisation unit level and the exact alert level name.')}</p>
                            {settings.interventions.map((item, index) => (
                                <div key={index} className={styles.card}>
                                    <SingleSelectField label={i18n.t('Organisation unit level')} selected={String(item.orgUnitLevel || '')} disabled={disabled || isLoading} onChange={({ selected }) => updateItem(index, { orgUnitLevel: Number(selected) })}>
                                        {(levels ?? []).map(level => <SingleSelectOption key={level.level} value={String(level.level)} label={level.displayName} />)}
                                    </SingleSelectField>
                                    <InputField name={`intervention-level-${index}`} label={i18n.t('Alert level')} value={item.alertLevel} disabled={disabled} onChange={({ value }) => updateItem(index, { alertLevel: value })} />
                                    <TextAreaField name={`intervention-action-${index}`} label={i18n.t('Recommended action')} value={item.action} disabled={disabled} onChange={({ value }) => updateItem(index, { action: value })} />
                                    <div><Button disabled={disabled} onClick={() => update({ interventions: settings.interventions.filter((_, position) => position !== index) })}>{i18n.t('Remove intervention')}</Button></div>
                                </div>
                            ))}
                            <div><Button disabled={disabled} onClick={() => update({ interventions: [...settings.interventions, { orgUnitLevel: 0, alertLevel: '', action: '' }] })}>{i18n.t('Add intervention')}</Button></div>
                        </>
                    );
                }}
            </SettingsEditor>
        </>
    );
};
