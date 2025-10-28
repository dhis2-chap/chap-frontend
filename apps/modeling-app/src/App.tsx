import {
    createHashRouter,
    RouterProvider,
    Navigate,
    Outlet,
} from 'react-router-dom';
import ErrorPage from './components/ErrorPage';
import React from 'react';
import './locales';
import './App.module.css';
import PageWrapper from './components/PageWrapper';
import { SetChapUrl } from './features/route-api/SetChapUrl';
import { SettingsPage } from './features/settings/Settings';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { CssReset, CssVariables } from '@dhis2/ui';
import { Layout } from './components/layout/Layout';
import { RouteValidator } from './components/RouteValidator';
import InfoAboutReportingBugs from './features/common-features/InfoAboutReportingBugs/InfoAboutReportingBugs';
import WarnAboutIncompatibleVersion from './features/common-features/WarnAboutIncompatibleVersion/WarnAboutIncompatibleVersion';
import { EvaluationPage } from './pages/EvaluationPage';
import { EvaluationDetailsPage } from './pages/EvaluationDetailsPage';
import { ChapValidator } from './components/ChapValidator';
import { NewEvaluationPage } from './pages/NewEvaluationPage';
import { JobsPage } from './pages/JobsPage';
import { EvaluationComparePage } from './pages/EvaluationCompare';
import { GetStartedPage } from './pages/GetStartedPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { PredictionDetailsPage } from './pages/PredictionDetailsPage';
import { ModelsPage } from './pages/ModelsPage';
import { NewConfiguredModelPage } from './pages/NewConfiguredModelPage';
import { SyncUrlWithGlobalShell } from './utils/syncUrlWithGlobalShell';
import { NewPredictionPage } from './pages/NewPredictionPage';

export type RouteHandle = {
    fullWidth?: boolean;
    /* whether to automatically collapse the sidebar when route is active */
    collapseSidebar?: boolean;
};

const router = createHashRouter([
    {
        element: (
            <>
                <SyncUrlWithGlobalShell />
                <Layout />
            </>
        ),
        errorElement: <ErrorPage />,
        children: [
            {
                path: '/',
                element: <Navigate to="/evaluate" replace />,
            },
            {
                element: (
                    <RouteValidator>
                        <ChapValidator>
                            <InfoAboutReportingBugs />
                            <WarnAboutIncompatibleVersion />
                            <PageWrapper>
                                <Outlet />
                            </PageWrapper>
                        </ChapValidator>
                    </RouteValidator>
                ),
                errorElement: <ErrorPage />,
                children: [
                    {
                        path: '/evaluate',
                        children: [
                            {
                                index: true,
                                element: <EvaluationPage />,
                            },
                            {
                                path: 'compare',
                                handle: {
                                    fullWidth: true,
                                } satisfies RouteHandle,
                                element: <EvaluationComparePage />,
                            },
                            {
                                path: 'new',
                                element: <NewEvaluationPage />,
                                handle: {
                                    collapseSidebar: true,
                                } satisfies RouteHandle,
                            },
                            {
                                path: ':evaluationId',
                                handle: {
                                    collapseSidebar: true,
                                } satisfies RouteHandle,
                                element: <EvaluationDetailsPage />,
                            },
                        ],
                    },
                    {
                        path: '/jobs',
                        element: <JobsPage />,
                    },
                    {
                        path: '/predictions',
                        children: [
                            {
                                index: true,
                                element: <PredictionsPage />,
                            },
                            {
                                path: ':predictionId',
                                handle: {
                                    collapseSidebar: true,
                                } satisfies RouteHandle,
                                element: <PredictionDetailsPage />,
                            },
                            {
                                path: 'new',
                                handle: {
                                    collapseSidebar: true,
                                } satisfies RouteHandle,
                                element: <NewPredictionPage />,
                            },
                        ],
                    },
                    {
                        path: '/models',
                        children: [
                            {
                                index: true,
                                element: <ModelsPage />,
                            },
                            {
                                path: 'new',
                                element: <NewConfiguredModelPage />,
                                handle: {
                                    collapseSidebar: true,
                                } satisfies RouteHandle,
                            },
                        ],
                    },
                ],
            },
            {
                path: '/settings',
                element: (
                    <PageWrapper>
                        <Outlet />
                    </PageWrapper>
                ),
                children: [
                    {
                        path: '/settings',
                        children: [
                            {
                                index: true,
                                element: <SettingsPage />,
                            },
                        ],
                    },
                ],
            },
            {
                path: '/get-started',
                handle: {
                    collapseSidebar: true,
                } satisfies RouteHandle,
                element: <GetStartedPage />,
            },
        ],
    },
]);

const App = () => {
    return (
        <>
            <CssReset />
            <CssVariables theme spacers colors elevations />
            <SetChapUrl>
                <RouterProvider router={router} />
            </SetChapUrl>
            <ReactQueryDevtools position="bottom-right" />
        </>
    );
};

export default App;
