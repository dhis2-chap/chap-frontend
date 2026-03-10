import type { BackTestPlotType } from '../models/BackTestPlotType';
import type { MetricInfo } from '../models/MetricInfo';
import type { VisualizationInfo } from '../models/VisualizationInfo';
import type { CancelablePromise } from '../core/CancelablePromise';
import { VisualizationsService } from './VisualizationsService';

export class VisualizationService {
    public static getAvilableMetricPlotsVisualizationMetricPlotsBacktestIdGet(
        backtestId: number,
    ): CancelablePromise<Array<VisualizationInfo>> {
        return VisualizationsService.getAvilableMetricPlotsV1VisualizationMetricPlotsBacktestIdGet(
            backtestId,
        );
    }

    public static getAvailableMetricsVisualizationMetricsBacktestIdGet(
        backtestId: number,
    ): CancelablePromise<Array<MetricInfo>> {
        return VisualizationsService.getAvailableMetricsV1VisualizationMetricsBacktestIdGet(
            backtestId,
        );
    }

    public static generateVisualizationVisualizationMetricPlotsVisualizationNameBacktestIdMetricIdGet(
        visualizationName: string,
        backtestId: number,
        metricId: string,
    ): CancelablePromise<any> {
        return VisualizationsService.generateVisualizationV1VisualizationMetricPlotsVisualizationNameBacktestIdMetricIdGet(
            visualizationName,
            backtestId,
            metricId,
        );
    }

    public static listBacktestPlotTypesVisualizationBacktestPlotsGet(): CancelablePromise<Array<BackTestPlotType>> {
        return VisualizationsService.listBacktestPlotTypesV1VisualizationBacktestPlotsGet();
    }

    public static generateBacktestPlotsVisualizationBacktestPlotsVisualizationNameBacktestIdGet(
        visualizationName: string,
        backtestId: number,
    ): CancelablePromise<any> {
        return VisualizationsService.generateBacktestPlotsV1VisualizationBacktestPlotsVisualizationNameBacktestIdGet(
            visualizationName,
            backtestId,
        );
    }
}
