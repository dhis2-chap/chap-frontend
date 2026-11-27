import i18n from '@dhis2/d2-i18n';
import { Button, NoticeBox } from '@dhis2/ui';
import { Card } from '@dhis2-chap/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { NewDatasetForm } from '../../components/NewDatasetForm';
import { formatPeriodRange } from '../BenchmarksPage/SpecificationParameters';
import { StepNav } from './StepNav';
import { useGuided } from './useGuidedProgress';
import styles from './GuidedSetupPage.module.css';

/** A setup keeps the data it started with, so other data is reached through another setup. */
const OtherSetups = () => {
    const navigate = useNavigate();
    return (
        <div className={styles.actions}>
            <Button small onClick={() => navigate('/guided')} dataTest="guided-other-setups">{i18n.t('Open another setup')}</Button>
            <Button small onClick={() => navigate('/guided/data?import=true')} dataTest="guided-new-setup">
                {i18n.t('Start a new setup with new data')}
            </Button>
        </div>
    );
};

export const DataPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { importedDatasets, dataset, isDatasetMissing, pathTo } = useGuided();
    const openEvaluation = async (datasetId: number) => {
        // The next step only opens for data the setup knows about.
        await queryClient.invalidateQueries({ queryKey: ['datasets'] });
        navigate(pathTo('evaluate', datasetId));
    };

    if (isDatasetMissing) {
        return (
            <Card className={styles.card}>
                <NoticeBox warning title={i18n.t('This data no longer exists')}>
                    {i18n.t('Open another setup, or start a new one with new data.')}
                </NoticeBox>
                <OtherSetups />
            </Card>
        );
    }

    // A setup starts with importing its data.
    if (!dataset) {
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
                        <span className={styles.nowrap}>
                            <Button small onClick={() => navigate('/guided')}>{i18n.t('Use data you have imported')}</Button>
                        </span>
                    )}
                </div>
                <NewDatasetForm onCreated={openEvaluation} prefillColumns />
            </>
        );
    }

    const columns = dataset.covariates ?? [];
    return (
        <>
            <Card className={styles.card}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h3 className={styles.title}>{i18n.t('Data of this setup')}</h3>
                        <p className={styles.description}>
                            {i18n.t('A setup follows one set of data from evaluation to predictions. Other data has a setup of its own.')}
                        </p>
                    </div>
                    <OtherSetups />
                </div>
                <div className={styles.list} data-test="guided-dataset">
                    <div className={styles.listItem}>
                        <span className={styles.itemLabel}>
                            <span className={styles.itemName}>{dataset.name}</span>
                            <span className={styles.muted}>
                                {[
                                    formatPeriodRange(dataset),
                                    i18n.t('{{count}} locations', { count: dataset.orgUnits?.length ?? 0, defaultValue: '{{count}} location', defaultValue_plural: '{{count}} locations' }),
                                ].join(' · ')}
                            </span>
                            {columns.length > 0 && (
                                <span className={styles.muted}>
                                    {i18n.t('Columns{{colon}} {{columns}}', { colon: ':', columns: columns.join(', ') })}
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </Card>
            <StepNav next={pathTo('evaluate')} nextLabel={i18n.t('Continue to evaluation')} />
        </>
    );
};
