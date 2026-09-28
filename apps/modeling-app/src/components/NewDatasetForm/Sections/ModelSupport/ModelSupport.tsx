import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, IconAdd16, NoticeBox } from '@dhis2/ui';
import type { ModelSpecRead } from '@dhis2-chap/ui';
import { type ModelSupport as ModelSupportResult } from '../../utils/datasetModels';
import styles from './ModelSupport.module.css';

type Props = {
    support: ModelSupportResult;
    isLoading: boolean;
    error?: unknown;
    onAddColumns: (covariateNames: string[]) => void;
};

const modelName = (model: ModelSpecRead) => model.displayName || model.name;

const PERIOD_TYPE_LABELS: Record<string, string> = {
    week: i18n.t('Weekly data'),
    month: i18n.t('Monthly data'),
};

export const ModelSupport = ({ support, isLoading, error, onAddColumns }: Props) => {
    if (isLoading) {
        return (
            <div className={styles.loading}>
                <CircularLoader small />
            </div>
        );
    }

    if (error) {
        return (
            <NoticeBox warning title={i18n.t('Could not load models')}>
                {i18n.t('You can still create the dataset, but we cannot tell which models can use it.')}
            </NoticeBox>
        );
    }

    const { supported, missingColumns, wrongPeriodType, nextColumns } = support;
    const total = supported.length + missingColumns.length + wrongPeriodType.length;
    const percentage = total ? Math.round((supported.length / total) * 100) : 0;

    return (
        <div className={styles.panel} data-test="dataset-model-support">
            <div>
                <h3 className={styles.title}>{i18n.t('Model support')}</h3>
                <p className={styles.summary}>
                    <span className={styles.count}>{supported.length}</span>
                    {' '}
                    {i18n.t('of {{total}} models can use this dataset', { total })}
                </p>
                <div
                    className={styles.meter}
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={total}
                    aria-valuenow={supported.length}
                    aria-label={i18n.t('Supported models')}
                >
                    <div className={styles.meterFill} style={{ width: `${percentage}%` }} />
                </div>
            </div>

            {nextColumns.length > 0 && (
                <div className={styles.group}>
                    <h4 className={styles.groupTitle}>{i18n.t('Add columns to support more models')}</h4>
                    <ul className={styles.list}>
                        {nextColumns.map(({ columns, models }) => (
                            <li key={columns.join()} className={styles.nextColumn}>
                                <span className={styles.gain}>
                                    {i18n.t('+{{count}} models', {
                                        count: models.length,
                                        defaultValue: '+{{count}} model',
                                        defaultValue_plural: '+{{count}} models',
                                    })}
                                </span>
                                <Button
                                    small
                                    icon={<IconAdd16 />}
                                    onClick={() => onAddColumns(columns)}
                                    dataTest={`dataset-add-columns-${columns.join('-')}`}
                                >
                                    {i18n.t('Add')}
                                </Button>
                                <span className={styles.columnNames}>
                                    {columns.map(name => <code key={name} className={styles.columnName}>{name}</code>)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {supported.length > 0 && (
                <details className={styles.group} open={supported.length <= 5}>
                    <summary className={styles.groupTitle}>
                        {i18n.t('Supported ({{count}})', { count: supported.length })}
                    </summary>
                    <ul className={styles.list}>
                        {supported.map(model => (
                            <li key={model.name} className={styles.model}>
                                <span className={styles.supportedDot} aria-hidden />
                                {modelName(model)}
                            </li>
                        ))}
                    </ul>
                </details>
            )}

            {(missingColumns.length > 0 || wrongPeriodType.length > 0) && (
                <details className={styles.group}>
                    <summary className={styles.groupTitle}>
                        {i18n.t('Not supported ({{count}})', { count: missingColumns.length + wrongPeriodType.length })}
                    </summary>
                    <ul className={styles.list}>
                        {missingColumns.map(({ model, missing }) => (
                            <li key={model.name} className={styles.model}>
                                <span className={styles.unsupportedDot} aria-hidden />
                                <div>
                                    <div>{modelName(model)}</div>
                                    <div className={styles.reason}>
                                        {i18n.t('Needs {{columns}}', { columns: missing.join(', ') })}
                                    </div>
                                </div>
                            </li>
                        ))}
                        {wrongPeriodType.map(model => (
                            <li key={model.name} className={styles.model}>
                                <span className={styles.unsupportedDot} aria-hidden />
                                <div>
                                    <div>{modelName(model)}</div>
                                    <div className={styles.reason}>
                                        {PERIOD_TYPE_LABELS[model.supportedPeriodType?.toLowerCase() ?? '']
                                            ?? i18n.t('A different period type')}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    );
};
