import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    IconChevronLeft16,
    IconChevronRight16,
    Input,
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
import type { OutbreakProbability, ThresholdTileViewModel, ZoomRange } from '@dhis2-chap/ui';
import { ID_MAIN_LAYOUT } from '../layout/Layout';
import styles from './ThresholdTilesExplorer.module.css';

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
    { label: i18n.t('Outbreak regions'), value: 'outbreak' },
    { label: i18n.t('No outbreak regions'), value: 'noOutbreak' },
    { label: i18n.t('Unavailable regions'), value: 'unavailable' },
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

const ThresholdTile = ({
    predictionTargetName,
    showThresholds,
    tile,
    zoomRange,
    onZoomChange,
}: {
    predictionTargetName: string;
    showThresholds: boolean;
    tile: ThresholdTileViewModel;
    zoomRange?: ZoomRange | null;
    onZoomChange?: (range: ZoomRange | null) => void;
}) => {
    const maxY = useMemo(() => (
        getStableMaxYForThresholdChart(
            tile.series,
            showThresholds ? tile.endemicThreshold : null,
        )
    ), [showThresholds, tile.endemicThreshold, tile.series]);

    return (
        <article className={styles.tile}>
            <div className={styles.tileHeader}>
                <h3 title={tile.orgUnitName}>{tile.orgUnitName}</h3>
                {showThresholds && (
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
                    outbreakPeriods={showThresholds
                        ? tile.indicators.map(indicator => ({
                                period: indicator.period,
                                outbreak: indicator.outbreak,
                                supportedProbability: indicator.supportedProbability,
                                value: indicator.value,
                            }))
                        : []}
                    variant="tile"
                    zoomRange={zoomRange}
                    onZoomChange={onZoomChange}
                    maxY={maxY}
                />
            </div>
        </article>
    );
};

type Props = {
    predictionTargetName: string;
    tiles: ThresholdTileViewModel[];
    showThresholds: boolean;
    showStatusFilter?: boolean;
    statusFilterVariant?: StatusFilterVariant;
    panel: ReactNode;
    panelHeader: string;
    gridResetKey?: string;
    zoomResetDeps?: unknown[];
};

export const ThresholdTilesExplorer = ({
    predictionTargetName,
    tiles,
    showThresholds,
    showStatusFilter = true,
    statusFilterVariant = 'clearable',
    panel,
    panelHeader,
    gridResetKey = '',
    zoomResetDeps = [],
}: Props) => {
    const [regionSearch, setRegionSearch] = useState('');
    const [clearableStatusFilter, setClearableStatusFilter] = useState<
        ThresholdTileViewModel['status'] | undefined
    >(undefined);
    const [allOptionStatusFilter, setAllOptionStatusFilter] = useState<StatusFilterValue>('all');
    const [zoomRange, setZoomRange] = useState<ZoomRange | null>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const isToolbarStuckRef = useRef(false);
    const scrollParent = useMainScrollParent();

    useEffect(() => {
        setZoomRange(null);
    }, zoomResetDeps);

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
    const activeStatusFilter = statusFilterVariant === 'all-option'
        ? allOptionStatusFilter
        : clearableStatusFilter;

    const filteredTiles = useMemo(() => (
        tiles.filter(tile => (
            (!showThresholds || !showStatusFilter || !activeStatusFilter || activeStatusFilter === 'all' || tile.status === activeStatusFilter) &&
            (
                normalizedRegionSearch.length === 0
                || tile.orgUnitName.toLocaleLowerCase().includes(normalizedRegionSearch)
            )
        ))
    ), [activeStatusFilter, normalizedRegionSearch, showStatusFilter, showThresholds, tiles]);

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
                    placeholder={i18n.t('Search regions')}
                    value={regionSearch}
                    onChange={({ value }) => setRegionSearch(value ?? '')}
                />
            </div>
            {showThresholds && showStatusFilter && (
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
                                key={`${gridResetKey}-${activeStatusFilter ?? 'all'}-${normalizedRegionSearch}-${showThresholds}`}
                                components={gridComponents}
                                computeItemKey={(index: number) => filteredTiles[index]?.orgUnitId ?? index}
                                customScrollParent={scrollParent ?? undefined}
                                increaseViewportBy={600}
                                itemContent={(index: number) => (
                                    <ThresholdTile
                                        predictionTargetName={predictionTargetName}
                                        showThresholds={showThresholds}
                                        tile={filteredTiles[index]}
                                        zoomRange={zoomRange}
                                        onZoomChange={setZoomRange}
                                    />
                                )}
                                totalCount={filteredTiles.length}
                            />
                        )
                    : (
                            <div className={styles.emptyState}>
                                {i18n.t('No regions match the selected filters.')}
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
