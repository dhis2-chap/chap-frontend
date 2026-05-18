import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HTMLAttributes } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    CircularLoader,
    IconChevronLeft16,
    IconChevronRight16,
    IconInfo16,
    Input,
    NoticeBox,
    SingleSelect,
    SingleSelectOption,
    Tooltip,
} from '@dhis2/ui';
import {
    buildOutbreakIndicatorsForSeries,
    calculateMockEndemicThreshold,
    getStableMaxYForThresholdChart,
    getThresholdTileViewModels,
    MINIMUM_THRESHOLD_OBSERVATIONS,
    OUTBREAK_PROBABILITY_OPTIONS,
    UncertaintyAreaChart,
    VirtuosoGrid,
    Widget,
} from '@dhis2-chap/ui';
import type {
    ModelSpecRead,
    OutbreakProbability,
    PredictionInfo,
    ThresholdTileViewModel,
    ZoomRange,
} from '@dhis2-chap/ui';
import { ID_MAIN_LAYOUT } from '../../layout/Layout';
import { usePredictionSeries } from '../PredictionDetails/hooks/usePredictionSeries';
import styles from './PredictionAlerts.module.css';

type Props = {
    prediction: PredictionInfo;
    predictionRuns?: PredictionInfo[];
    isLoadingPredictionRuns?: boolean;
    model: ModelSpecRead;
    selectedProbability: OutbreakProbability;
    onSelectPrediction?: (predictionId: number) => void;
    onSelectProbability: (probability: OutbreakProbability) => void;
    density?: 'page' | 'dialog';
};

const SummaryLabel = ({
    label,
    tooltip,
}: {
    label: string;
    tooltip: string;
}) => (
    <dt className={styles.summaryLabel}>
        <span>{label}</span>
        <Tooltip
            content={tooltip}
            placement="top"
        >
            <span className={styles.tooltipIcon}>
                <IconInfo16 />
            </span>
        </Tooltip>
    </dt>
);

const GridList = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({
    className,
    ...props
}, ref) => (
    <div
        {...props}
        ref={ref}
        className={[styles.thresholdGrid, className].filter(Boolean).join(' ')}
    />
));

GridList.displayName = 'ThresholdGridList';

const GridItem = ({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>) => (
    <div
        {...props}
        className={[styles.thresholdGridItem, className].filter(Boolean).join(' ')}
    />
);

const gridComponents = {
    Item: GridItem,
    List: GridList,
};

const useMainScrollParent = () => {
    const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setScrollParent(document.getElementById(ID_MAIN_LAYOUT));
    }, []);

    return scrollParent;
};

const statusLabels = {
    outbreak: i18n.t('Outbreak'),
    noOutbreak: i18n.t('No outbreak'),
    unavailable: i18n.t('Unavailable'),
};

type StatusFilter = 'all' | ThresholdTileViewModel['status'];

const statusFilterOptions: Array<{
    label: string;
    value: StatusFilter;
}> = [
    { label: i18n.t('All statuses'), value: 'all' },
    { label: i18n.t('Outbreak regions'), value: 'outbreak' },
    { label: i18n.t('No outbreak regions'), value: 'noOutbreak' },
    { label: i18n.t('Unavailable regions'), value: 'unavailable' },
];

const EMPTY_VALUE = '-';

const formatPredictionRunLabel = (run: PredictionInfo) => {
    const created = run.created
        ? new Intl.DateTimeFormat(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
            }).format(new Date(run.created))
        : EMPTY_VALUE;

    return `${run.name || i18n.t('Unnamed prediction')} (${created})`;
};

const ThresholdTile = ({
    predictionTargetName,
    tile,
    zoomRange,
    onZoomChange,
}: {
    predictionTargetName: string;
    tile: ThresholdTileViewModel;
    zoomRange?: ZoomRange | null;
    onZoomChange?: (range: ZoomRange | null) => void;
}) => {
    const maxY = useMemo(() => (
        getStableMaxYForThresholdChart(tile.series, tile.endemicThreshold)
    ), [tile.endemicThreshold, tile.series]);

    return (
        <article className={styles.thresholdTile}>
            <div className={styles.thresholdTileHeader}>
                <h3 title={tile.orgUnitName}>{tile.orgUnitName}</h3>
                <span className={[
                    styles.thresholdStatusBadge,
                    tile.status === 'outbreak'
                        ? styles.thresholdStatusOutbreak
                        : tile.status === 'unavailable'
                            ? styles.thresholdStatusUnavailable
                            : styles.thresholdStatusNoOutbreak,
                ].join(' ')}
                >
                    {statusLabels[tile.status]}
                </span>
            </div>
            <div className={styles.thresholdChart}>
                <UncertaintyAreaChart
                    predictionTargetName={predictionTargetName}
                    series={tile.series}
                    endemicThreshold={tile.endemicThreshold}
                    outbreakPeriods={tile.indicators.map(indicator => ({
                        period: indicator.period,
                        outbreak: indicator.outbreak,
                        supportedProbability: indicator.supportedProbability,
                        value: indicator.value,
                    }))}
                    variant="tile"
                    zoomRange={zoomRange}
                    onZoomChange={onZoomChange}
                    maxY={maxY}
                />
            </div>
        </article>
    );
};

export const PredictionAlertsConfigurator = ({
    prediction,
    predictionRuns = [prediction],
    isLoadingPredictionRuns = false,
    model,
    selectedProbability,
    onSelectPrediction,
    onSelectProbability,
    density = 'page',
}: Props) => {
    const [selectedOrgUnitId, setSelectedOrgUnitId] = useState<string | undefined>(undefined);
    const [regionSearch, setRegionSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [zoomRange, setZoomRange] = useState<ZoomRange | null>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const isToolbarStuckRef = useRef(false);
    const {
        series,
        predictionTargetName,
        isLoading,
        error,
    } = usePredictionSeries({ prediction, model });
    const scrollParent = useMainScrollParent();

    const selectedSeries = series.find(s => s.orgUnitId === selectedOrgUnitId) ?? series[0];
    const selectedThreshold = useMemo(() => (
        calculateMockEndemicThreshold(selectedSeries?.actualCases)
    ), [selectedSeries]);
    const selectedMaxY = useMemo(() => (
        selectedSeries
            ? getStableMaxYForThresholdChart(selectedSeries, selectedThreshold.threshold)
            : undefined
    ), [selectedSeries, selectedThreshold.threshold]);
    const selectedIndicators = useMemo(() => (
        selectedSeries
            ? buildOutbreakIndicatorsForSeries(selectedSeries, selectedProbability)
            : []
    ), [selectedSeries, selectedProbability]);

    useEffect(() => {
        setZoomRange(null);
    }, [prediction.id, selectedProbability]);

    const {
        summary,
        tiles,
    } = useMemo(() => (
        getThresholdTileViewModels(series, selectedProbability)
    ), [series, selectedProbability]);

    useEffect(() => {
        const toolbar = toolbarRef.current;
        if (!toolbar || !scrollParent) return;

        let animationFrame: number | null = null;

        const updateToolbarStuckState = () => {
            animationFrame = null;

            const nextIsStuck = (
                toolbar.getBoundingClientRect().top
                <= scrollParent.getBoundingClientRect().top + 0.5
            );

            toolbar.classList.toggle(styles.thresholdToolbarStuck, nextIsStuck);

            if (isToolbarStuckRef.current === nextIsStuck) return;

            isToolbarStuckRef.current = nextIsStuck;
        };

        const requestUpdate = () => {
            if (animationFrame !== null) return;

            animationFrame = window.requestAnimationFrame(updateToolbarStuckState);
        };

        updateToolbarStuckState();
        scrollParent.addEventListener('scroll', requestUpdate, { passive: true });
        window.addEventListener('resize', requestUpdate);

        return () => {
            scrollParent.removeEventListener('scroll', requestUpdate);
            window.removeEventListener('resize', requestUpdate);

            if (animationFrame !== null) {
                window.cancelAnimationFrame(animationFrame);
            }
        };
    }, [isLoading, scrollParent]);

    const normalizedRegionSearch = regionSearch.trim().toLocaleLowerCase();
    const filteredTiles = useMemo(() => (
        tiles.filter(tile => (
            (statusFilter === 'all' || tile.status === statusFilter) &&
            (
                normalizedRegionSearch.length === 0
                || tile.orgUnitName.toLocaleLowerCase().includes(normalizedRegionSearch)
            )
        ))
    ), [normalizedRegionSearch, statusFilter, tiles]);

    const shiftZoom = useCallback((direction: 1 | -1) => {
        setZoomRange((prev) => {
            if (!prev) return null;

            const nextMin = prev.min + direction;
            const nextMax = prev.max + direction;
            if (nextMin < prev.dataMin || nextMax > prev.dataMax) return prev;

            return {
                ...prev,
                min: nextMin,
                max: nextMax,
            };
        });
    }, []);

    const resetZoom = useCallback(() => {
        setZoomRange(null);
    }, []);

    const isZoomed = zoomRange !== null;
    const canShiftLeft = isZoomed && zoomRange.min > zoomRange.dataMin;
    const canShiftRight = isZoomed && zoomRange.max < zoomRange.dataMax;

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (error) {
        return (
            <NoticeBox error title={i18n.t('Unable to load prediction data')}>
                {i18n.t('There was a problem loading the prediction data required for alert configuration.')}
            </NoticeBox>
        );
    }

    if (!selectedSeries || tiles.length === 0) {
        return (
            <NoticeBox warning title={i18n.t('No prediction data found')}>
                {i18n.t('This prediction has no forecast data to configure alerts for.')}
            </NoticeBox>
        );
    }

    const probabilityControl = (
        <div className={[styles.panelSection, styles.probabilityControl].join(' ')}>
            <h3>{i18n.t('Minimum outbreak probability')}</h3>
            <div className={styles.segmentedControl}>
                {OUTBREAK_PROBABILITY_OPTIONS.map(probability => (
                    <button
                        key={probability}
                        type="button"
                        className={[
                            styles.segmentButton,
                            probability === selectedProbability
                                ? styles.selectedSegmentButton
                                : '',
                        ].join(' ')}
                        onClick={() => onSelectProbability(probability)}
                    >
                        {`${probability}%`}
                    </button>
                ))}
            </div>
        </div>
    );

    const predictionRunControl = (
        <div className={styles.panelSection}>
            <h3>{i18n.t('Prediction run')}</h3>
            <SingleSelect
                dense
                disabled={!onSelectPrediction}
                loading={isLoadingPredictionRuns}
                onChange={({ selected }) => {
                    const predictionId = Number(selected);

                    if (Number.isFinite(predictionId) && predictionId !== prediction.id) {
                        onSelectPrediction?.(predictionId);
                    }
                }}
                selected={String(prediction.id)}
            >
                {predictionRuns.map(run => (
                    <SingleSelectOption
                        key={run.id}
                        value={String(run.id)}
                        label={formatPredictionRunLabel(run)}
                    />
                ))}
            </SingleSelect>
        </div>
    );

    const filterToolbar = (
        <div className={styles.thresholdFilters}>
            <div className={styles.regionSearch}>
                <Input
                    dense
                    placeholder={i18n.t('Search regions')}
                    value={regionSearch}
                    onChange={({ value }) => setRegionSearch(value ?? '')}
                />
            </div>
            <div className={styles.statusFilter}>
                <span className={styles.filterLabel}>{i18n.t('Status filter')}</span>
                <div className={styles.statusSelect}>
                    <SingleSelect
                        dense
                        selected={statusFilter}
                        onChange={({ selected }) => {
                            if (statusFilterOptions.some(option => option.value === selected)) {
                                setStatusFilter(selected as StatusFilter);
                            }
                        }}
                    >
                        {statusFilterOptions.map(({ label, value }) => (
                            <SingleSelectOption
                                key={value}
                                value={value}
                                label={label}
                            />
                        ))}
                    </SingleSelect>
                </div>
            </div>
        </div>
    );

    const zoomControls = (
        <div className={styles.zoomControls}>
            <Tooltip content={i18n.t('Shift zoom left')}>
                <Button
                    small
                    secondary
                    disabled={!canShiftLeft}
                    onClick={() => shiftZoom(-1)}
                    aria-label={i18n.t('Shift zoom left one period')}
                    icon={<IconChevronLeft16 />}
                />
            </Tooltip>
            <Button
                small
                secondary
                disabled={!isZoomed}
                onClick={resetZoom}
            >
                {i18n.t('Reset zoom')}
            </Button>
            <Tooltip content={i18n.t('Shift zoom right')}>
                <Button
                    small
                    secondary
                    disabled={!canShiftRight}
                    onClick={() => shiftZoom(1)}
                    aria-label={i18n.t('Shift zoom right one period')}
                    icon={<IconChevronRight16 />}
                />
            </Tooltip>
        </div>
    );

    if (density === 'page') {
        return (
            <div className={styles.thresholdContainer}>
                <div
                    ref={toolbarRef}
                    className={[
                        styles.thresholdToolbar,
                        isToolbarStuckRef.current ? styles.thresholdToolbarStuck : '',
                    ].join(' ')}
                >
                    {filterToolbar}
                    {zoomControls}
                </div>
                <div className={styles.thresholdGridColumn}>
                    {filteredTiles.length > 0
                        ? (
                                <VirtuosoGrid
                                    key={`${prediction.id}-${statusFilter}-${normalizedRegionSearch}`}
                                    components={gridComponents}
                                    computeItemKey={(index: number) => filteredTiles[index]?.orgUnitId ?? index}
                                    customScrollParent={scrollParent ?? undefined}
                                    increaseViewportBy={600}
                                    itemContent={(index: number) => (
                                        <ThresholdTile
                                            predictionTargetName={predictionTargetName}
                                            tile={filteredTiles[index]}
                                            zoomRange={zoomRange}
                                            onZoomChange={setZoomRange}
                                        />
                                    )}
                                    totalCount={filteredTiles.length}
                                />
                            )
                        : (
                                <div className={styles.noFilteredRegions}>
                                    {i18n.t('No regions match the selected filters.')}
                                </div>
                            )}
                </div>
                <div className={styles.thresholdPanelColumn}>
                    <Widget header={i18n.t('Threshold controls')} noncollapsible>
                        <div className={styles.panelContent}>
                            <div className={styles.panelSection}>
                                <h3>{i18n.t('Prediction target')}</h3>
                                <p className={styles.targetName}>{predictionTargetName}</p>
                            </div>
                            {predictionRunControl}
                            {probabilityControl}
                            <dl className={styles.summaryList}>
                                <div>
                                    <SummaryLabel
                                        label={i18n.t('Regions with alerts')}
                                        tooltip={i18n.t('Number of regions with at least one forecast period marked as an outbreak.')}
                                    />
                                    <dd>{`${summary.regionsWithAlerts} / ${summary.totalRegions}`}</dd>
                                </div>
                                <div>
                                    <SummaryLabel
                                        label={i18n.t('Alert periods')}
                                        tooltip={i18n.t('Total number of alerts across all regions.')}
                                    />
                                    <dd>{summary.alertPeriods}</dd>
                                </div>
                                {summary.unavailableThresholds > 0 && (
                                    <div>
                                        <SummaryLabel
                                            label={i18n.t('Thresholds unavailable')}
                                            tooltip={i18n.t('Number of regions without enough historical disease data to calculate a threshold.')}
                                        />
                                        <dd>{summary.unavailableThresholds}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </Widget>
                </div>
            </div>
        );
    }

    return (
        <div className={[
            styles.container,
            density === 'dialog' ? styles.dialogContainer : '',
        ].join(' ')}
        >
            {density === 'dialog' && (
                <div className={styles.dialogProbabilityControl}>
                    {probabilityControl}
                </div>
            )}
            <div className={styles.leftColumn}>
                <Widget header={density === 'dialog' ? ' ' : i18n.t('Alert preview')} noncollapsible>
                    <div className={[
                        styles.previewLayout,
                        density === 'dialog' ? styles.dialogPreviewLayout : '',
                    ].join(' ')}
                    >
                        <div className={styles.orgUnitList}>
                            {series.map((orgUnitSeries) => {
                                const threshold = calculateMockEndemicThreshold(orgUnitSeries.actualCases);
                                const indicators = buildOutbreakIndicatorsForSeries(
                                    orgUnitSeries,
                                    selectedProbability,
                                );
                                const hasOutbreak = threshold.available &&
                                    indicators.some(indicator => indicator.outbreak);
                                const tooltipLabel = !threshold.available
                                    ? i18n.t('Threshold unavailable')
                                    : hasOutbreak
                                        ? i18n.t('Outbreak detected')
                                        : null;

                                return (
                                    <button
                                        key={orgUnitSeries.orgUnitId}
                                        type="button"
                                        className={[
                                            styles.orgUnitButton,
                                            selectedSeries.orgUnitId === orgUnitSeries.orgUnitId
                                                ? styles.selectedOrgUnitButton
                                                : '',
                                        ].join(' ')}
                                        onClick={() => setSelectedOrgUnitId(orgUnitSeries.orgUnitId)}
                                    >
                                        <span className={styles.orgUnitName}>
                                            {orgUnitSeries.orgUnitName}
                                        </span>
                                        {hasOutbreak && tooltipLabel && (
                                            <Tooltip content={tooltipLabel}>
                                                <span
                                                    className={[
                                                        styles.statusIndicator,
                                                        styles.statusOutbreak,
                                                    ].join(' ')}
                                                    aria-label={tooltipLabel}
                                                />
                                            </Tooltip>
                                        )}
                                        {!threshold.available && tooltipLabel && (
                                            <Tooltip content={tooltipLabel}>
                                                <span
                                                    className={[
                                                        styles.statusIndicator,
                                                        styles.statusUnavailable,
                                                    ].join(' ')}
                                                    aria-label={tooltipLabel}
                                                />
                                            </Tooltip>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className={styles.chartArea}>
                            {!selectedThreshold.available && (
                                <NoticeBox warning title={i18n.t('Endemic threshold unavailable')}>
                                    {i18n.t('At least {{count}} historical observations are required for the mocked threshold.', {
                                        count: MINIMUM_THRESHOLD_OBSERVATIONS,
                                    })}
                                </NoticeBox>
                            )}
                            <UncertaintyAreaChart
                                predictionTargetName={predictionTargetName}
                                series={selectedSeries}
                                endemicThreshold={selectedThreshold.threshold}
                                outbreakPeriods={selectedIndicators.map(indicator => ({
                                    period: indicator.period,
                                    outbreak: indicator.outbreak,
                                    supportedProbability: indicator.supportedProbability,
                                    value: indicator.value,
                                }))}
                                maxY={selectedMaxY}
                            />
                        </div>
                    </div>
                </Widget>
            </div>
        </div>
    );
};
