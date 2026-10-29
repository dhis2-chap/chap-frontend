import { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    Divider,
    IconChevronLeft16,
    IconChevronRight16,
    Input,
    MultiSelect,
    MultiSelectOption,
    SingleSelect,
    SingleSelectOption,
    Tooltip,
} from '@dhis2/ui';
import {
    getStableMaxYForThresholdChart,
    OUTBREAK_PROBABILITY_OPTIONS,
    UncertaintyAreaChart,
    VirtuosoGrid,
    Widget,
} from '@dhis2-chap/ui';
import type { OutbreakProbability, ThresholdChartLine, ThresholdTileViewModel, ZoomRange } from '@dhis2-chap/ui';
import { ID_MAIN_LAYOUT } from '../layout/Layout';
import { getAlertColor } from '@/components/BackendAlerts/alertLevelDisplay';
import { AlertLevelTag } from '@/components/BackendAlerts/AlertLevelTag';
import type { DisplayedPredictionAlert } from '@/components/BackendAlerts/displayPredictionAlerts';
import styles from './ThresholdTilesExplorer.module.css';

const NO_ALERTS: DisplayedPredictionAlert[] = [];

export type StatusFilterValue = ThresholdTileViewModel['status'] | 'all' | undefined;

type StatusFilterVariant = 'clearable' | 'all-option';

const statusLabels = {
    outbreak: i18n.t('Outbreak'),
    noOutbreak: i18n.t('No outbreak'),
    unavailable: i18n.t('Unavailable'),
};

const clearableStatusFilterOptions: Array<{
    label: string;
    value: ThresholdTileViewModel['status'];
}> = [
    { label: i18n.t('Organisation units with outbreaks'), value: 'outbreak' },
    { label: i18n.t('Organisation units without outbreaks'), value: 'noOutbreak' },
    { label: i18n.t('Organisation units with unavailable thresholds'), value: 'unavailable' },
];

const allOptionStatusFilterOptions: Array<{
    label: string;
    value: StatusFilterValue;
}> = [
    { label: i18n.t('All statuses'), value: 'all' },
    ...clearableStatusFilterOptions,
];

const useMainScrollParent = () => {
    const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setScrollParent(document.getElementById(ID_MAIN_LAYOUT));
    }, []);

    return scrollParent;
};

const GridList = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({
    className,
    ...props
}, ref) => (
    <div
        {...props}
        ref={ref}
        className={[styles.grid, className].filter(Boolean).join(' ')}
    />
));

GridList.displayName = 'ThresholdTilesGridList';

const GridItem = ({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>) => (
    <div
        {...props}
        className={[styles.gridItem, className].filter(Boolean).join(' ')}
    />
);

const gridComponents = {
    Item: GridItem,
    List: GridList,
};

const ThresholdTile = memo(function ThresholdTile({
    predictionTargetName,
    selectedProbability,
    showThresholds,
    tile,
    raisedAlerts,
    thresholdLines,
    zoomRange,
    onZoomChange,
}: {
    predictionTargetName: string;
    selectedProbability: OutbreakProbability;
    showThresholds: boolean;
    tile: ThresholdTileViewModel;
    raisedAlerts?: DisplayedPredictionAlert[];
    thresholdLines?: ThresholdChartLine[];
    zoomRange?: ZoomRange | null;
    onZoomChange?: (range: ZoomRange | null) => void;
}) {
    const maxY = useMemo(() => {
        const explorationThreshold = tile.endemicThresholds.length > 0
            ? tile.endemicThresholds
            : tile.endemicThreshold;
        const visibleThreshold = thresholdLines?.flatMap(line => line.points)
            ?? (showThresholds ? explorationThreshold : null);
        return getStableMaxYForThresholdChart(tile.series, visibleThreshold);
    }, [showThresholds, thresholdLines, tile.endemicThreshold, tile.endemicThresholds, tile.series]);
    // Zoom-only renders should update the axis, without rebuilding all of the
    // Highcharts options because this array acquired a new identity.
    const outbreakPeriods = useMemo(() => (
        showThresholds
            ? tile.indicators.map(indicator => ({
                    period: indicator.period,
                    outbreak: indicator.outbreak,
                    supportedProbability: indicator.supportedProbability,
                    value: indicator.value,
                }))
            : []
    ), [showThresholds, tile.indicators]);

    const alertPeriods = useMemo(() => raisedAlerts?.map(alert => ({
        period: alert.timePeriod,
        label: alert.display.label,
        color: getAlertColor(alert.display.color).background,
    })), [raisedAlerts]);

    return (
        <article className={styles.tile}>
            <div className={styles.tileHeader}>
                <h3 title={tile.orgUnitName}>{tile.orgUnitName}</h3>
                {raisedAlerts?.[0] && <AlertLevelTag display={raisedAlerts[0].display} />}
                {raisedAlerts === undefined && showThresholds && (
                    <span className={[
                        styles.statusBadge,
                        tile.status === 'outbreak'
                            ? styles.statusOutbreak
                            : tile.status === 'unavailable'
                                ? styles.statusUnavailable
                                : styles.statusNoOutbreak,
                    ].join(' ')}
                    >
                        {statusLabels[tile.status]}
                    </span>
                )}
            </div>
            <div className={styles.chart}>
                <UncertaintyAreaChart
                    predictionTargetName={predictionTargetName}
                    series={tile.series}
                    endemicThreshold={showThresholds ? tile.endemicThreshold : undefined}
                    endemicThresholds={showThresholds ? tile.endemicThresholds : undefined}
                    outbreakPeriods={outbreakPeriods}
                    alertPeriods={alertPeriods}
                    thresholdLines={thresholdLines}
                    outbreakProbability={showThresholds ? selectedProbability : undefined}
                    variant="tile"
                    zoomRange={zoomRange}
                    onZoomChange={onZoomChange}
                    maxY={maxY}
                />
            </div>
        </article>
    );
});

type Props = {
    predictionTargetName: string;
    selectedProbability: OutbreakProbability;
    tiles: ThresholdTileViewModel[];
    raisedAlerts?: DisplayedPredictionAlert[];
    policyThresholdLines?: Map<string, ThresholdChartLine[]>;
    showThresholds: boolean;
    showStatusFilter?: boolean;
    statusFilterVariant?: StatusFilterVariant;
    panel: ReactNode;
    panelHeader: string;
    gridResetKey?: string;
};

export const ThresholdTilesExplorer = ({
    predictionTargetName,
    selectedProbability,
    tiles,
    raisedAlerts,
    policyThresholdLines,
    showThresholds,
    showStatusFilter = true,
    statusFilterVariant = 'clearable',
    panel,
    panelHeader,
    gridResetKey = '',
}: Props) => {
    const alertsByOrgUnit = useMemo(() => {
        if (!raisedAlerts) return undefined;
        const map = new Map<string, DisplayedPredictionAlert[]>();
        for (const alert of raisedAlerts) {
            const group = map.get(alert.orgUnit) ?? [];
            group.push(alert);
            map.set(alert.orgUnit, group);
        }
        return map;
    }, [raisedAlerts]);
    const alertLevels = useMemo(() => (
        [...new Set(raisedAlerts?.map(alert => alert.level))]
    ), [raisedAlerts]);
    const [alertLevelSelection, setAlertLevelSelection] = useState<string[]>([]);
    // Refetched alerts can drop a selected level; only keep levels that still exist.
    const selectedAlertLevels = useMemo(() => (
        alertLevelSelection.filter(level => alertLevels.includes(level))
    ), [alertLevelSelection, alertLevels]);
    const isAlertLevelFilterShown = alertLevels.length > 0;
    const areAllAlertLevelsSelected = selectedAlertLevels.length === alertLevels.length;
    const [regionSearch, setRegionSearch] = useState('');
    const [clearableStatusFilter, setClearableStatusFilter] = useState<
        ThresholdTileViewModel['status'] | undefined
    >(undefined);
    const [allOptionStatusFilter, setAllOptionStatusFilter] = useState<StatusFilterValue>('all');
    const [zoomRange, setZoomRange] = useState<ZoomRange | null>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const isToolbarStuckRef = useRef(false);
    const scrollParent = useMainScrollParent();

    // Only a new prediction resets the zoom and alert filter: changing alert
    // settings or exploring thresholds keeps both.
    useEffect(() => {
        setZoomRange(null);
        setAlertLevelSelection([]);
    }, [gridResetKey]);

    useEffect(() => {
        if (!showThresholds && clearableStatusFilter !== undefined) {
            setClearableStatusFilter(undefined);
        }
    }, [showThresholds, clearableStatusFilter]);

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

            toolbar.classList.toggle(styles.toolbarStuck, nextIsStuck);

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
    }, [scrollParent, tiles.length]);

    const normalizedRegionSearch = regionSearch.trim().toLocaleLowerCase();
    // Threshold status must not hide regions with recorded alerts.
    const isStatusFilterShown = showThresholds && showStatusFilter && !raisedAlerts;
    const activeStatusFilter = statusFilterVariant === 'all-option'
        ? allOptionStatusFilter
        : clearableStatusFilter;

    const filteredTiles = useMemo(() => (
        tiles.filter(tile => (
            (!isStatusFilterShown || !activeStatusFilter || activeStatusFilter === 'all' || tile.status === activeStatusFilter) &&
            (selectedAlertLevels.length === 0 || alertsByOrgUnit?.get(tile.orgUnitId)?.some(alert => (
                selectedAlertLevels.includes(alert.level)
            ))) &&
            (
                normalizedRegionSearch.length === 0
                || tile.orgUnitName.toLocaleLowerCase().includes(normalizedRegionSearch)
            )
        ))
    ), [activeStatusFilter, isStatusFilterShown, selectedAlertLevels, alertsByOrgUnit, normalizedRegionSearch, tiles]);

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

    const filterToolbar = (
        <div className={styles.filters}>
            <div className={styles.regionSearch}>
                <Input
                    dense
                    placeholder={i18n.t('Search organisation units')}
                    value={regionSearch}
                    onChange={({ value }) => setRegionSearch(value ?? '')}
                />
            </div>
            {isAlertLevelFilterShown && (
                <div className={styles.alertSelect}>
                    <MultiSelect
                        dense
                        clearable
                        clearText={i18n.t('Remove filter')}
                        placeholder={i18n.t('Filter by alert level')}
                        prefix={selectedAlertLevels.length > 0 ? i18n.t('Alert level') : undefined}
                        selected={selectedAlertLevels}
                        onChange={({ selected }) => setAlertLevelSelection(selected)}
                        dataTest="alert-level-filter"
                    >
                        {/* Wrapped so the menu leaves this row alone: it toggles every level instead of one value. */}
                        <div className={styles.selectAll}>
                            <MultiSelectOption
                                label={i18n.t('Select all')}
                                value="select-all"
                                active={areAllAlertLevelsSelected}
                                onClick={() => setAlertLevelSelection(areAllAlertLevelsSelected ? [] : alertLevels)}
                                dataTest="alert-level-filter-select-all"
                            />
                            <Divider margin="0" />
                        </div>
                        {alertLevels.map(level => (
                            <MultiSelectOption key={level} value={level} label={level} />
                        ))}
                    </MultiSelect>
                </div>
            )}
            {isStatusFilterShown && (
                <div className={styles.statusFilter}>
                    <span className={styles.filterLabel}>{i18n.t('Status filter')}</span>
                    <div className={styles.statusSelect}>
                        {statusFilterVariant === 'clearable'
                            ? (
                                    <SingleSelect
                                        dense
                                        clearable
                                        clearText={i18n.t('Clear')}
                                        placeholder={i18n.t('All statuses')}
                                        selected={clearableStatusFilter ?? ''}
                                        onChange={({ selected }) => {
                                            if (!selected) {
                                                setClearableStatusFilter(undefined);
                                                return;
                                            }
                                            if (clearableStatusFilterOptions.some(option => option.value === selected)) {
                                                setClearableStatusFilter(selected as ThresholdTileViewModel['status']);
                                            }
                                        }}
                                    >
                                        {clearableStatusFilterOptions.map(({ label, value }) => (
                                            <SingleSelectOption
                                                key={value}
                                                value={value}
                                                label={label}
                                            />
                                        ))}
                                    </SingleSelect>
                                )
                            : (
                                    <SingleSelect
                                        dense
                                        selected={allOptionStatusFilter ?? 'all'}
                                        onChange={({ selected }) => {
                                            if (allOptionStatusFilterOptions.some(option => option.value === selected)) {
                                                setAllOptionStatusFilter(selected as StatusFilterValue);
                                            }
                                        }}
                                    >
                                        {allOptionStatusFilterOptions.map(({ label, value }) => (
                                            <SingleSelectOption
                                                key={value}
                                                value={value ?? 'all'}
                                                label={label}
                                            />
                                        ))}
                                    </SingleSelect>
                                )}
                    </div>
                </div>
            )}
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

    return (
        <div className={styles.container}>
            <div
                ref={toolbarRef}
                className={[
                    styles.toolbar,
                    isToolbarStuckRef.current ? styles.toolbarStuck : '',
                ].join(' ')}
            >
                {filterToolbar}
                {zoomControls}
            </div>
            <div className={styles.gridColumn}>
                {filteredTiles.length > 0
                    ? (
                            <VirtuosoGrid
                                key={`${gridResetKey}-${activeStatusFilter ?? 'all'}-${selectedAlertLevels.join(',')}-${normalizedRegionSearch}`}
                                components={gridComponents}
                                computeItemKey={(index: number) => filteredTiles[index]?.orgUnitId ?? index}
                                customScrollParent={scrollParent ?? undefined}
                                increaseViewportBy={600}
                                itemContent={(index: number) => (
                                    <ThresholdTile
                                        predictionTargetName={predictionTargetName}
                                        selectedProbability={selectedProbability}
                                        showThresholds={showThresholds}
                                        tile={filteredTiles[index]}
                                        raisedAlerts={alertsByOrgUnit ? alertsByOrgUnit.get(filteredTiles[index].orgUnitId) ?? NO_ALERTS : undefined}
                                        thresholdLines={policyThresholdLines?.get(filteredTiles[index].orgUnitId)}
                                        zoomRange={zoomRange}
                                        onZoomChange={setZoomRange}
                                    />
                                )}
                                totalCount={filteredTiles.length}
                            />
                        )
                    : (
                            <div className={styles.emptyState}>
                                {i18n.t('No organisation units match the selected filters.')}
                            </div>
                        )}
            </div>
            <div className={styles.panelColumn}>
                <Widget header={panelHeader} noncollapsible>
                    <div className={styles.panelContent}>
                        {panel}
                    </div>
                </Widget>
            </div>
        </div>
    );
};

export const SummaryRow = ({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) => (
    <div>
        <dt>{label}</dt>
        <dd>{value}</dd>
    </div>
);

export const OutbreakProbabilityControl = ({
    selectedProbability,
    onSelectProbability,
    compact = false,
}: {
    selectedProbability: OutbreakProbability;
    onSelectProbability: (probability: OutbreakProbability) => void;
    compact?: boolean;
}) => {
    return (
        <div className={[styles.panelSection, compact ? styles.compactProbabilityControl : ''].filter(Boolean).join(' ')}>
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
};
