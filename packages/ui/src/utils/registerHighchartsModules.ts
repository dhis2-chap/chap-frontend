import Highcharts from 'highcharts';
import accessibility from 'highcharts/modules/accessibility';
import exporting from 'highcharts/modules/exporting';
import offlineExporting from 'highcharts/modules/offline-exporting';
import highchartsMore from 'highcharts/highcharts-more';

/**
 * Registers the Highcharts feature modules used across the chart components.
 *
 * These were previously invoked at module top level, which meant importing any
 * chart (or the package barrel that re-exports them) eagerly executed the
 * registration. That made the modules impossible to import outside a browser
 * (e.g. in unit tests) and defeated tree-shaking. Calling this lazily from a
 * chart's render keeps the registration out of the import path while still
 * guaranteeing the modules are active before the first chart is drawn.
 *
 * `offline-exporting` extends `exporting`, so `exporting` must be registered
 * first. The guard makes repeated calls cheap and idempotent.
 */
let modulesRegistered = false;

export const registerHighchartsModules = () => {
    if (modulesRegistered) {
        return;
    }
    modulesRegistered = true;

    accessibility(Highcharts);
    exporting(Highcharts);
    offlineExporting(Highcharts);
    highchartsMore(Highcharts);
};
