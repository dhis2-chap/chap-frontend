import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent, MouseEvent } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    ButtonStrip,
    CircularLoader,
    IconChevronLeft16,
    IconChevronRight16,
    IconImportItems24,
    Input,
    NoticeBox,
    SingleSelect,
    SingleSelectOption,
    Switch,
    Tooltip,
} from '@dhis2/ui';
import {
    DEFAULT_OUTBREAK_PROBABILITY,
    getStableMaxYForThresholdChart,
    getThresholdTileViewModels,
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
import { ID_MAIN_LAYOUT } from '../../../layout/Layout';
import { usePredictionSeries } from '../hooks/usePredictionSeries';
import styles from './PredictionDetailsGrid.module.css';

export type PredictionRunAlertSettings = {
    alertProbability: OutbreakProbability;
    thresholdsEnabled: boolean;
};

type Props = {
    isEditing: boolean;
    model: ModelSpecRead;
    onCancel: () => void;
    onEdit: () => void;
    onImport: () => void;
    onSave: () => void;
    onSettingsChange: (settings: PredictionRunAlertSettings) => void;
    prediction: PredictionInfo;
    settings: PredictionRunAlertSettings;
};

const DEFAULT_SETTINGS: PredictionRunAlertSettings = {
    alertProbability: DEFAULT_OUTBREAK_PROBABILITY,
    thresholdsEnabled: true,
};

export const getDefaultPredictionRunAlertSettings = () => ({ ...DEFAULT_SETTINGS });

type StatusFilter = ThresholdTileViewModel['status'];

const statusLabels = {
    outbreak: i18n.t('Outbreak'),
    noOutbreak: i18n.t('No outbreak'),
    unavailable: i18n.t('Unavailable'),
};

const statusFilterOptions: Array<{
    label: string;
    value: StatusFilter;
}> = [
    { label: i18n.t('Outbreak regions'), value: 'outbreak' },
    { label: i18n.t('No outbreak regions'), value: 'noOutbreak' },
    { label: i18n.t('Unavailable regions'), value: 'unavailable' },
];

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

GridList.displayName = 'PredictionDetailsGridList';

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

const useMainScrollParent = () => {
    const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setScrollParent(document.getElementById(ID_MAIN_LAYOUT));
    }, []);

    return scrollParent;
};

const SummaryRow = ({
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

export const PredictionDetailsGrid = ({
    isEditing,
    model,
    onCancel,
    onEdit,
    onImport,
    onSave,
    onSettingsChange,
    prediction,
    settings,
}: Props) => {
    const [regionSearch, setRegionSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter | undefined>(undefined);
    const [zoomRange, setZoomRange] = useState<ZoomRange | null>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const isToolbarStuckRef = useRef(false);
    const scrollParent = useMainScrollParent();
    const {
        series,
        predictionTargetName,
        isLoading,
        error,
    } = usePredictionSeries({ prediction, model });
    const showThresholds = settings.thresholdsEnabled;

    useEffect(() => {
        setZoomRange(null);
    }, [prediction.id, settings.alertProbability, settings.thresholdsEnabled]);

    useEffect(() => {
        if (!showThresholds && statusFilter !== undefined) {
            setStatusFilter(undefined);
        }
    }, [showThresholds, statusFilter]);

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
    }, [isLoading, scrollParent]);

    const {
        summary,
        tiles,
    } = useMemo(() => (
        getThresholdTileViewModels(series, settings.alertProbability)
    ), [series, settings.alertProbability]);

    const normalizedRegionSearch = regionSearch.trim().toLocaleLowerCase();
    const filteredTiles = useMemo(() => (
        tiles.filter(tile => (
            (!showThresholds || !statusFilter || tile.status === statusFilter) &&
            (
                normalizedRegionSearch.length === 0
                || tile.orgUnitName.toLocaleLowerCase().includes(normalizedRegionSearch)
            )
        ))
    ), [normalizedRegionSearch, showThresholds, statusFilter, tiles]);

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

    const updateSettings = (nextSettings: Partial<PredictionRunAlertSettings>) => {
        onSettingsChange({
            ...settings,
            ...nextSettings,
        });
    };

    const toggleThresholds = () => {
        updateSettings({ thresholdsEnabled: !settings.thresholdsEnabled });
    };

    const handleThresholdKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleThresholds();
        }
    };

    const handleSwitchClick = (event: MouseEvent) => {
        event.stopPropagation();
    };

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
                {i18n.t('There was a problem loading the prediction data required for this prediction run.')}
            </NoticeBox>
        );
    }

    if (tiles.length === 0) {
        return (
            <NoticeBox warning title={i18n.t('No prediction data found')}>
                {i18n.t('This prediction has no forecast data to display.')}
            </NoticeBox>
        );
    }

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
            {showThresholds && (
                <div className={styles.statusFilter}>
                    <span className={styles.filterLabel}>{i18n.t('Status filter')}</span>
                    <div className={styles.statusSelect}>
                        <SingleSelect
                            dense
                            clearable
                            clearText={i18n.t('Clear')}
                            placeholder={i18n.t('All statuses')}
                            selected={statusFilter ?? ''}
                            onChange={({ selected }) => {
                                if (!selected) {
                                    setStatusFilter(undefined);
                                    return;
                                }
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

    const summaryList = (
        <dl className={styles.summaryList}>
            <SummaryRow
                label={i18n.t('Regions with alerts')}
                value={`${summary.regionsWithAlerts} / ${summary.totalRegions}`}
            />
            <SummaryRow
                label={i18n.t('Alert periods')}
                value={summary.alertPeriods}
            />
            {summary.unavailableThresholds > 0 && (
                <SummaryRow
                    label={i18n.t('Thresholds unavailable')}
                    value={summary.unavailableThresholds}
                />
            )}
        </dl>
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
                                key={`${prediction.id}-${statusFilter ?? 'all'}-${normalizedRegionSearch}-${showThresholds}`}
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
                <Widget header={i18n.t('Prediction settings')} noncollapsible>
                    <div className={styles.panelContent}>
                        <div className={styles.panelSection}>
                            <h3>{i18n.t('Prediction target')}</h3>
                            <p className={styles.targetName}>{predictionTargetName}</p>
                        </div>

                        {isEditing
                            ? (
                                    <>
                                        <div
                                            className={styles.toggleButton}
                                            onClick={toggleThresholds}
                                            onKeyDown={handleThresholdKeyDown}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <div className={styles.toggleText}>
                                                <span className={styles.toggleTitle}>
                                                    {i18n.t('Outbreak thresholds')}
                                                </span>
                                                <span className={styles.toggleDescription}>
                                                    {i18n.t('Show outbreak status and threshold overlays for this run.')}
                                                </span>
                                            </div>
                                            <span onClick={handleSwitchClick}>
                                                <Switch
                                                    checked={settings.thresholdsEnabled}
                                                    onChange={toggleThresholds}
                                                />
                                            </span>
                                        </div>
                                        {showThresholds && (
                                            <div className={styles.panelSection}>
                                                <h3>{i18n.t('Minimum outbreak probability')}</h3>
                                                <div className={styles.segmentedControl}>
                                                    {OUTBREAK_PROBABILITY_OPTIONS.map(probability => (
                                                        <button
                                                            key={probability}
                                                            type="button"
                                                            className={[
                                                                styles.segmentButton,
                                                                probability === settings.alertProbability
                                                                    ? styles.selectedSegmentButton
                                                                    : '',
                                                            ].join(' ')}
                                                            onClick={() => updateSettings({ alertProbability: probability })}
                                                        >
                                                            {`${probability}%`}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {showThresholds && summaryList}
                                        <ButtonStrip end>
                                            <Button
                                                small
                                                onClick={onCancel}
                                            >
                                                {i18n.t('Cancel')}
                                            </Button>
                                            <Button
                                                small
                                                primary
                                                onClick={onSave}
                                            >
                                                {i18n.t('Save')}
                                            </Button>
                                        </ButtonStrip>
                                    </>
                                )
                            : (
                                    <>
                                        <dl className={styles.summaryList}>
                                            <SummaryRow
                                                label={i18n.t('Outbreak thresholds')}
                                                value={showThresholds ? i18n.t('Enabled') : i18n.t('Disabled')}
                                            />
                                            {showThresholds && (
                                                <SummaryRow
                                                    label={i18n.t('Minimum outbreak probability')}
                                                    value={`${settings.alertProbability}%`}
                                                />
                                            )}
                                        </dl>
                                        {showThresholds && summaryList}
                                        <ButtonStrip end>
                                            <Button
                                                small
                                                onClick={onEdit}
                                            >
                                                {i18n.t('Edit')}
                                            </Button>
                                            <Button
                                                small
                                                primary
                                                icon={<IconImportItems24 />}
                                                onClick={onImport}
                                            >
                                                {i18n.t('Import')}
                                            </Button>
                                        </ButtonStrip>
                                    </>
                                )}
                    </div>
                </Widget>
            </div>
        </div>
    );
};
