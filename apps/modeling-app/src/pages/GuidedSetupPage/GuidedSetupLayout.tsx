import i18n from '@dhis2/d2-i18n';
import { CircularLoader } from '@dhis2/ui';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ChapErrorNotice } from '../../components/ChapErrorNotice';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { OverviewPage } from './OverviewPage';
import { Stepper } from './Stepper';
import { GUIDED_STEPS, useGuidedProgress } from './useGuidedProgress';
import styles from './GuidedSetupPage.module.css';

export const GuidedSetupLayout = () => {
    const progress = useGuidedProgress();
    const { pathname } = useLocation();
    const step = GUIDED_STEPS.find(item => pathname.endsWith(`/${item}`));
    const isOverview = /^\/guided\/?$/.test(pathname);

    // Chap Core before 2.4.0 has no evaluations to follow, so those servers keep the dashboard as their start page.
    if (!progress.isVersionLoading && !progress.isAvailable) return <Navigate to="/dashboard" replace />;

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Guided setup')}
                pageDescription={i18n.t('Four steps from your DHIS2 data to predictions.')}
            />
            {progress.error ? (
                <ChapErrorNotice error={progress.error} title={i18n.t('Could not load your setup')} />
            ) : progress.isLoading ? (
                <CircularLoader />
            ) : isOverview ? (
                // The overview lists the setups that have been started; with none there is only the first step.
                progress.importedDatasets.length ? <OverviewPage progress={progress} /> : <Navigate to={progress.pathTo('data')} replace />
            ) : !step || GUIDED_STEPS.indexOf(step) > GUIDED_STEPS.indexOf(progress.current) ? (
                // Open on the step that is waiting, and never on one whose earlier steps are not done.
                <Navigate to={progress.pathTo(progress.current)} replace />
            ) : (
                <>
                    {progress.importedDatasets.length > 0 && (
                        <Link className={styles.backLink} to="/guided" data-test="guided-all-setups">{i18n.t('All setups')}</Link>
                    )}
                    <Stepper progress={progress} active={step} />
                    <div className={styles.page}>
                        <Outlet context={progress} />
                    </div>
                </>
            )}
        </>
    );
};
