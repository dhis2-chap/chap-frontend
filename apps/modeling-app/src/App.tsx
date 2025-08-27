import {
    createHashRouter,
    RouterProvider,
    Navigate,
    Outlet,
} from 'react-router-dom'
import ErrorPage from './components/ErrorPage'
import './locales'
import './App.module.css'
import PageWrapper from './components/PageWrapper'
import EvaluationPageLegacy from './pages/EvaluationPageLegacy'
import ModelTemplatesPage from './pages/ModelTemplatesPage'
import PredictionOverview from './features/predictions-overview/PredictionOverview'
import { SetChapUrl } from './features/route-api/SetChapUrl'
import { SettingsPage } from './features/settings/Settings'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { CssReset, CssVariables } from '@dhis2/ui'
import { Layout } from './components/layout/Layout'
import { RouteValidator } from './components/RouteValidator'
import InfoAboutReportingBugs from './features/common-features/InfoAboutReportingBugs/InfoAboutReportingBugs'
import WarnAboutIncompatibleVersion from './features/common-features/WarnAboutIncompatibleVersion/WarnAboutIncompatibleVersion'
import { EvaluationPage } from './pages/EvaluationPage'
import { ChapValidator } from './components/ChapValidator'
import { NewEvaluationPage } from './pages/NewEvaluationPage'
import { JobsPage } from './pages/JobsPage'
import { EvaluationComparePage } from './pages/EvaluationCompare'
import { GetStartedPage } from './pages/GetStartedPage'
import { SyncUrlWithGlobalShell } from './utils/syncUrlWithGlobalShell'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export type RouteHandle = {
    fullWidth?: boolean
    /* whether to automatically collapse the sidebar when route is active*/
    collapseSidebar?: boolean
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: false,
        },
    },
})

const router = createHashRouter([
    {
        element: (
            <>
                <SyncUrlWithGlobalShell />
                <Layout />,
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
                        ],
                    },
                    {
                        path: '/evaluate-old',
                        element: <EvaluationPageLegacy />,
                    },
                    {
                        path: '/jobs',
                        element: <JobsPage />,
                    },
                    {
                        path: '/predict',
                        element: <PredictionOverview />,
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
                            {
                                path: 'models',
                                element: <ModelTemplatesPage />,
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
])

const App = () => {
    return (
        <>
            <QueryClientProvider client={queryClient}>
                <CssReset />
                <CssVariables theme spacers colors elevations />
                <SetChapUrl>
                    <RouterProvider router={router} />
                </SetChapUrl>
                <ReactQueryDevtools position="bottom-right" />
            </QueryClientProvider>
        </>
    )
}

export default App
