import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, NoticeBox, Radio } from '@dhis2/ui';
import { Card } from '@dhis2-chap/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { NewDatasetForm } from '../../components/NewDatasetForm';
import { formatPeriodRange } from '../BenchmarksPage/SpecificationParameters';
import { StepNav } from './StepNav';
import { useGuided } from './useGuidedProgress';
import styles from './GuidedSetupPage.module.css';

export const DataPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { importedDatasets, dataset, isDatasetMissing, pathTo } = useGuided();
    // With nothing imported yet, importing is the only thing to do here.
    const [isImporting, setIsImporting] = useState(!importedDatasets.length);
    const openEvaluation = async (datasetId: number) => {
        // The next step only opens for data the setup knows about.
        await queryClient.invalidateQueries({ queryKey: ['datasets'] });
        navigate(pathTo('evaluate', datasetId));
    };

    if (isImporting) {
        return (
            <>
                <div className={styles.sectionHeader}>
                    <div>
                        <h3 className={styles.title}>{i18n.t('Import data from DHIS2')}</h3>
                        <p className={styles.description}>
                            {i18n.t('Choose the disease cases you want to predict, and the climate and population data the models use.')}
                        </p>
                    </div>
                    {importedDatasets.length > 0 && (
                        <Button small onClick={() => setIsImporting(false)}>{i18n.t('Use data you have imported')}</Button>
                    )}
                </div>
                <NewDatasetForm onCreated={openEvaluation} prefillColumns />
            </>
        );
    }

    return (
        <>
            <Card className={styles.card}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h3 className={styles.title}>{i18n.t('Data you have imported')}</h3>
                        <p className={styles.description}>{i18n.t('Choose the data to work with, or import new data from DHIS2.')}</p>
                    </div>
                    <Button onClick={() => setIsImporting(true)} dataTest="guided-import-data">{i18n.t('Import new data')}</Button>
                </div>
                {isDatasetMissing && (
                    <NoticeBox warning title={i18n.t('This data no longer exists')}>
                        {i18n.t('Choose other data to continue.')}
                    </NoticeBox>
                )}
                <ul className={styles.list}>
                    {importedDatasets.map(item => (
                        <li key={item.id} className={styles.listItem}>
                            <Radio
                                name="guided-dataset"
                                value={String(item.id)}
                                checked={item.id === dataset?.id}
                                onChange={() => navigate(pathTo('data', item.id), { replace: true })}
                                dataTest={`guided-dataset-${item.id}`}
                                label={(
                                    <span className={styles.itemLabel}>
                                        <span className={styles.itemName}>{item.name}</span>
                                        <span className={styles.muted}>
                                            {[
                                                formatPeriodRange(item),
                                                i18n.t('{{count}} locations', { count: item.orgUnits?.length ?? 0, defaultValue: '{{count}} location', defaultValue_plural: '{{count}} locations' }),
                                            ].join(' · ')}
                                        </span>
                                    </span>
                                )}
                            />
                        </li>
                    ))}
                </ul>
            </Card>
            <StepNav
                next={pathTo('evaluate')}
                nextLabel={i18n.t('Continue to evaluation')}
                blockedReason={dataset ? undefined : i18n.t('Choose data first')}
            />
        </>
    );
};
