import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';
import {
    CssReset,
    CssVariables,
} from '@dhis2/ui';
import { PluginContent } from './components/PluginContent';
import type { DashboardPluginProps } from './types';

const queryClient = new QueryClient();

const Plugin = (props: DashboardPluginProps) => (
    <QueryClientProvider client={queryClient}>
        <CssReset />
        <CssVariables theme spacers colors elevations />
        <PluginContent {...props} />
    </QueryClientProvider>
);

export default Plugin;
