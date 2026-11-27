import i18n from '@dhis2/d2-i18n';
import { CircularLoader, Tag } from '@dhis2/ui';
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
            <div className={styles.experimental} data-test="guided-experimental">
                <Tag neutral>{i18n.t('Experimental')}</Tag>
                <span className={styles.muted}>
                    {i18n.t('The guided setup is new and will change. Everything it makes is also under All tools in the menu. Tell us what works and what does not with Report a bug.')}
                </span>
            </div>
            {progress.error ? (
                <ChapErrorNotice error={progress.error} title={i18n.t('Could not load your setup')} />
            ) : progress.isLoading ? (
                <CircularLoader />
            ) : isOverview ? (
                // The overview lists the setups that have been started; with none there is only the first step.
                progress.importedDatasets.length ? <OverviewPage progress={progress} /> : <Navigate to={progress.pathTo('data')} replace />
            ) : !step ? (
                // Open on the step that is waiting.
                progress.isSpecificationLoading ? <CircularLoader /> : <Navigate to={progress.pathTo(progress.current)} replace />
            ) : !progress.isSpecificationLoading && GUIDED_STEPS.indexOf(step) > GUIDED_STEPS.indexOf(progress.current) ? (
                // Never open a step whose earlier steps are not done.
                <Navigate to={progress.pathTo(progress.current)} replace />
            ) : (
                <>
                    {progress.importedDatasets.length > 0 && (
                        <Link className={styles.backLink} to="/guided" data-test="guided-all-setups">{i18n.t('All setups')}</Link>
                    )}
                    <Stepper progress={progress} active={step} />
                    <div className={styles.page}>
                        {/* The data of a setup does not wait for its evaluation; the later steps do, with the steps staying in place. */}
                        {progress.isSpecificationLoading && step !== 'data' ? <CircularLoader /> : <Outlet context={progress} />}
                    </div>
                </>
            )}
        </>
    );
};
