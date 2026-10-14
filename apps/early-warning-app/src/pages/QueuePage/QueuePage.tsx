import i18n from '@dhis2/d2-i18n';
import { DataTable, DataTableBody, DataTableCell, DataTableColumnHeader, DataTableHead, DataTableRow, NoticeBox } from '@dhis2/ui';
import { Card, Pill, useRoute } from '@dhis2-chap/ui';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { ErrorNotice, Loading } from '../../components/StateViews';
import { usePredictionReviews } from '../../hooks/usePredictionReviews';
import styles from './QueuePage.module.css';

export const QueuePage = () => {
    const { route, isLoading: isRouteLoading, error: routeError } = useRoute();
    const { reviews, isLoading, error } = usePredictionReviews(!!route);

    const content = () => {
        if (isRouteLoading) return <Loading />;
        if (routeError) return <ErrorNotice error={routeError} />;
        if (!route) {
            return (
                <NoticeBox warning title={i18n.t('No CHAP route configured')}>
                    {i18n.t('Add a route to your CHAP server to start using the Early Warning App.')}
                    {' '}
                    <Link to="/settings">{i18n.t('Go to settings')}</Link>
                </NoticeBox>
            );
        }
        if (isLoading) return <Loading />;
        if (error) return <ErrorNotice error={error} />;
        if (reviews.length === 0) {
            return (
                <NoticeBox title={i18n.t('No predictions awaiting review')}>
                    {i18n.t('Predictions appear here when CHAP raises pending alerts.')}
                </NoticeBox>
            );
        }
        return (
            <Card className={styles.card}>
                <DataTable>
                    <DataTableHead>
                        <DataTableRow>
                            <DataTableColumnHeader>{i18n.t('Prediction')}</DataTableColumnHeader>
                            <DataTableColumnHeader>{i18n.t('Model')}</DataTableColumnHeader>
                            <DataTableColumnHeader>{i18n.t('Created')}</DataTableColumnHeader>
                            <DataTableColumnHeader>{i18n.t('Pending alerts')}</DataTableColumnHeader>
                        </DataTableRow>
                    </DataTableHead>
                    <DataTableBody>
                        {reviews.map(({ prediction, levelCounts }) => (
                            <DataTableRow key={prediction.id}>
                                <DataTableCell>
                                    <Link className={styles.strong} to={`/predictions/${prediction.id}`}>{prediction.name}</Link>
                                    <span className={styles.muted}>{i18n.t('Prediction {{id}}', { id: `#${prediction.id}` })}</span>
                                </DataTableCell>
                                <DataTableCell>{prediction.configuredModel?.name ?? prediction.modelId}</DataTableCell>
                                <DataTableCell className={styles.nowrap}>{format(new Date(prediction.created), 'dd.MM.yyyy, HH:mm')}</DataTableCell>
                                <DataTableCell>
                                    <div className={styles.levels}>
                                        {levelCounts.map(({ level, count }) => (
                                            <Pill key={level}>{`${level} ${count}`}</Pill>
                                        ))}
                                    </div>
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            </Card>
        );
    };

    return (
        <>
            <PageHeader
                title={i18n.t('Review queue')}
                description={i18n.t('Predictions with alerts that have not been reviewed yet, newest first.')}
            />
            {content()}
        </>
    );
};
