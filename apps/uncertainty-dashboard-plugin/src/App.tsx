import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';
import {
    CssReset,
    CssVariables,
} from '@dhis2/ui';
import { PluginContent } from './components/PluginContent';

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <CssReset />
        <CssVariables theme spacers colors elevations />
        <PluginContent
            dashboardItemId="local-preview"
            dashboardMode="edit"
            dashboardItemFilters={{}}
        />
    </QueryClientProvider>
);

export default App;
