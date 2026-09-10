import i18n from '@dhis2/d2-i18n';
import { Widget } from '@dhis2-chap/ui';
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
} from '@dhis2/ui';
import styles from './EvaluationMetricsWidget.module.css';

type Props = {
    metrics?: Record<string, number> | null;
};

export const EvaluationMetricsWidget = ({ metrics }: Props) => {
    const entries = Object.entries(metrics ?? {});

    return (
        <Widget header={i18n.t('Evaluation metrics')} noncollapsible>
            <div className={styles.content}>
                {entries.length === 0 ? (
                    <p className={styles.description}>
                        {i18n.t('No metrics available for this evaluation.')}
                    </p>
                ) : (
                    <>
                        <p className={styles.description}>
                            {i18n.t('Scores aggregated across all evaluation splits and organisation units.')}
                        </p>
                        <DataTable>
                            <DataTableHead>
                                <DataTableRow>
                                    <DataTableColumnHeader scope="col">
                                        {i18n.t('Metric')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader scope="col" align="right">
                                        {i18n.t('Score')}
                                    </DataTableColumnHeader>
                                </DataTableRow>
                            </DataTableHead>
                            <DataTableBody>
                                {entries.map(([metric, score]) => (
                                    <DataTableRow key={metric}>
                                        <DataTableCell tag="th" scope="row" className={styles.metric}>
                                            {metric}
                                        </DataTableCell>
                                        <DataTableCell align="right">
                                            {Number.isFinite(score)
                                                ? score.toLocaleString(undefined, { maximumSignificantDigits: 4 })
                                                : i18n.t('Not available')}
                                        </DataTableCell>
                                    </DataTableRow>
                                ))}
                            </DataTableBody>
                        </DataTable>
                    </>
                )}
            </div>
        </Widget>
    );
};
