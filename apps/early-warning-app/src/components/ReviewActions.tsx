import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, ButtonStrip, DataTable, DataTableBody, DataTableCell, DataTableColumnHeader, DataTableHead, DataTableRow, NoticeBox, SingleSelect, SingleSelectOption } from '@dhis2/ui';
import { Widget } from '@dhis2-chap/ui';
import { ReviewImport } from './ReviewImport';
import { SubmitReviewModal } from './SubmitReviewModal';
import { useImportLedger } from '../hooks/useImportLedger';
import { describeImportedIndicators, getWithdrawnIndicators, updateImportLedger } from '../utils/importLedger';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { useReviewData } from '../hooks/useReviewData';
import type { SubmitReviewInput } from '../hooks/useSubmitReview';
import { buildReviewDataValues, hasImportMapping } from '../utils/import';
import { getDecisionChanges, type Decision } from '../utils/reviewSubmission';
import styles from './ReviewActions.module.css';

export const ReviewActions = ({ data }: { data: ReturnType<typeof useReviewData> }) => {
    const { alerts, entries, orgUnits, prediction, setup } = data;
    const currentUser = useCurrentUser();
    const ledger = useImportLedger(prediction?.id);
    const [decisions, setDecisions] = useState(new Map<number, Decision>());
    const [importEnabled, setImportEnabled] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [preview, setPreview] = useState<{ input: SubmitReviewInput; pendingCount: number }>();
    const mapping = setup?.quantileTargets ?? [];
    const changes = getDecisionChanges(alerts, decisions);
    const withdrawn = getWithdrawnIndicators(ledger.data?.records ?? [], [
        ...changes.declined,
        ...alerts.filter(alert => alert.approved === 'declined' && decisions.get(alert.id) !== 'accept'),
    ]);
    const available = hasImportMapping(mapping);
    const forecastOrgUnits = [...new Set(entries.map(entry => entry.orgUnit))].map(id => ({ id, displayName: orgUnits.get(id)?.displayName ?? id }));
    const choose = (ids: number[], decision?: Decision) => setDecisions((current) => {
        const next = new Map(current);
        ids.forEach(id => decision ? next.set(id, decision) : next.delete(id));
        return next;
    });
    const openPreview = () => {
        if (!prediction) return;
        const accepted = alerts.filter(alert => decisions.get(alert.id) === 'accept' || (!decisions.has(alert.id) && alert.approved === 'approved'));
        const dataValues = importEnabled && available ? buildReviewDataValues(entries, mapping, new Set(selected), accepted) : [];
        const imported = describeImportedIndicators(dataValues, mapping.find(target => target.quantile === 'outbreak_indicator')?.dataElementId, accepted);
        setPreview({
            input: {
                reviewer: currentUser.displayName ?? currentUser.username ?? '', accepted: changes.accepted, declined: changes.declined,
                dataValues,
                clearValues: withdrawn.map(({ dataElement, period, orgUnit }) => ({ dataElement, period, orgUnit })),
                afterImport: imported.length || withdrawn.length
                    ? () => ledger.save(updateImportLedger(ledger.data?.records ?? [], imported, withdrawn)) : undefined,
            },
            pendingCount: alerts.filter(alert => (!alert.approved || alert.approved === 'pending') && !decisions.has(alert.id)).length,
        });
    };
    return (
        <Widget header={i18n.t('Review decisions')} noncollapsible>
            <div className={styles.content}>
                <ButtonStrip>
                    <Button onClick={() => choose(alerts.filter(alert => !alert.approved || alert.approved === 'pending').map(alert => alert.id), 'accept')}>{i18n.t('Accept all pending')}</Button>
                    <Button onClick={() => choose(alerts.filter(alert => !alert.approved || alert.approved === 'pending').map(alert => alert.id), 'decline')}>{i18n.t('Decline all pending')}</Button>
                </ButtonStrip>
                <DataTable>
                    <DataTableHead>
                        <DataTableRow>
                            <DataTableColumnHeader>{i18n.t('Organisation unit')}</DataTableColumnHeader>
                            <DataTableColumnHeader>{i18n.t('Period')}</DataTableColumnHeader>
                            <DataTableColumnHeader>{i18n.t('Alert level')}</DataTableColumnHeader>
                            <DataTableColumnHeader>{i18n.t('Current status')}</DataTableColumnHeader>
                            <DataTableColumnHeader>{i18n.t('Decision')}</DataTableColumnHeader>
                        </DataTableRow>
                    </DataTableHead>
                    <DataTableBody>
                        {alerts.map(alert => (
                            <DataTableRow key={alert.id}>
                                <DataTableCell>{orgUnits.get(alert.orgUnit)?.displayName ?? alert.orgUnit}</DataTableCell>
                                <DataTableCell>{alert.timePeriod}</DataTableCell>
                                <DataTableCell>
                                    {alert.level}
                                </DataTableCell>
                                <DataTableCell>{alert.approved === 'approved' ? i18n.t('Accepted') : alert.approved === 'declined' ? i18n.t('Declined') : i18n.t('Pending')}</DataTableCell>
                                <DataTableCell>
                                    <SingleSelect selected={decisions.get(alert.id) ?? ''} onChange={({ selected }) => choose([alert.id], selected as Decision || undefined)}>
                                        <SingleSelectOption value="" label={i18n.t('Leave unchanged')} />
                                        <SingleSelectOption value="accept" label={i18n.t('Accept')} />
                                        <SingleSelectOption value="decline" label={alert.approved === 'approved' ? i18n.t('Withdraw') : i18n.t('Decline')} />
                                    </SingleSelect>
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
                {currentUser.error && <NoticeBox error title={i18n.t('Unable to identify the current reviewer')}>{currentUser.error.message}</NoticeBox>}
                {ledger.error && <NoticeBox error title={i18n.t('Unable to load import history')}>{ledger.error.message}</NoticeBox>}
                {withdrawn.length > 0 && <NoticeBox>{i18n.t('{{count}} previously imported outbreak indicators will be cleared, using their original mappings.', { count: withdrawn.length })}</NoticeBox>}
                <ReviewImport enabled={importEnabled} available={available} selected={selected} orgUnits={forecastOrgUnits} onEnabledChange={setImportEnabled} onSelectionChange={setSelected} />
                <Button primary disabled={ledger.isLoading || !!ledger.error || currentUser.isLoading || !!currentUser.error || !currentUser.username || !(changes.accepted.length + changes.declined.length + withdrawn.length || (importEnabled && available && selected.length))} onClick={openPreview}>{i18n.t('Preview review')}</Button>
                {preview && (
                    <SubmitReviewModal
                        {...preview}
                        onClose={() => setPreview(undefined)}
                        onDone={() => {
                            setPreview(undefined);
                            setDecisions(new Map());
                        }}
                    />
                )}
            </div>
        </Widget>
    );
};
