import { CssReset, CssVariables } from '@dhis2/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { ChapApiProvider } from './components/ChapApiProvider';
import { Layout } from './components/Layout';
import { QueuePage } from './pages/QueuePage';
import { HistoryPage } from './pages/HistoryPage';
import { ReviewPage } from './pages/ReviewPage';
import './locales';

const queryClient = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
});

const router = createHashRouter([{
    element: <Layout />,
    children: [
        { path: '/history', element: <HistoryPage /> },
        { path: '/', element: <QueuePage /> },
        { path: '/predictions/:predictionId', element: <ReviewPage /> },
    ],
}]);

const App = () => (
    <QueryClientProvider client={queryClient}>
        <CssReset />
        <CssVariables colors spacers theme />
        <ChapApiProvider>
            <RouterProvider router={router} />
        </ChapApiProvider>
    </QueryClientProvider>
);

export default App;
