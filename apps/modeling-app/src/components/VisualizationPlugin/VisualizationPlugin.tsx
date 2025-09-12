import React from 'react';
import { Plugin } from '@dhis2/app-runtime/experimental';

export type VisualizationColumn = {
    dimension: string;
    items: { id: string }[];
};

export type Visualization = {
    type: string;
    columns: VisualizationColumn[];
    rows: VisualizationColumn[];
    filters: VisualizationColumn[];
};

export interface VisualizationPluginProps {
    pluginSource: string;
    height: string;
    displayProperty: string;
    forDashboard: boolean;
    visualization: Visualization;
}

export const VisualizationPlugin: React.FC<VisualizationPluginProps> = props => (
    // @ts-expect-error - Plugin is missing correct types
    <Plugin<VisualizationPluginProps>
        pluginSource="http://localhost:8080/dhis-web-data-visualizer/plugin.html"
        {...props}
    />
);
