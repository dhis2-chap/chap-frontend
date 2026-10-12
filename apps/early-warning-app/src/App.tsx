import { CssReset, CssVariables } from '@dhis2/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { ChapApiProvider } from './components/ChapApiProvider';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import './locales';

const queryClient = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
});

const router = createHashRouter([{
    element: <Layout />,
    children: [
        { path: '/', element: <HomePage /> },
        { path: '/settings', element: <SettingsPage /> },
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
