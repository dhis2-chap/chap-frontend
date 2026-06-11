import { useMemo, useState } from 'react';
import {
    Button,
    ButtonStrip,
    IconArrowRight16,
    IconCalendar16,
    IconCheckmark16,
    IconDimensionData16,
    IconWorld16,
    Input,
    MenuItem,
    Modal,
    ModalContent,
    ModalTitle,
    MultiSelect,
    MultiSelectOption,
    SingleSelect,
    Tooltip,
} from '@dhis2/ui';
import { IconFlag16 } from '@dhis2/ui-icons';
import i18n from '@dhis2/d2-i18n';
import { PERIOD_TYPES } from '@dhis2-chap/core';
import cn from 'classnames';
import { AuthorAssessedStatus, type ModelSpecRead } from '@dhis2-chap/ui';
import { toDataTestKey } from '@/utils/dataTestKey';
import styles from './ModelSelectionModal.module.css';

type Props = {
    models?: ModelSpecRead[];
    selectedModel?: ModelSpecRead;
    onClose: () => void;
    onConfirm: (model: ModelSpecRead) => void;
};

type ReadinessConfig = {
    label: string;
    description: string;
    color: string;
    rank: number;
};

type CovariateFilterOption = {
    label: string;
    value: string;
};

const READINESS_BY_STATUS: Record<AuthorAssessedStatus, ReadinessConfig> = {
    [AuthorAssessedStatus.GREEN]: {
        label: i18n.t('Production'),
        description: i18n.t('Approved for general use.'),
        color: '#2e7d32',
        rank: 0,
    },
    [AuthorAssessedStatus.YELLOW]: {
        label: i18n.t('Testing'),
        description: i18n.t('Prepared for more extensive testing; not yet approved for production.'),
        color: '#f57f17',
        rank: 1,
    },
    [AuthorAssessedStatus.ORANGE]: {
        label: i18n.t('Limited'),
        description: i18n.t('Tested on a small dataset. Requires manual tuning and close monitoring.'),
        color: '#ef6c00',
        rank: 2,
    },
    [AuthorAssessedStatus.RED]: {
        label: i18n.t('Experimental'),
        description: i18n.t('An early prototype with no formal validation - only for initial experimentation.'),
        color: '#c62828',
        rank: 3,
    },
    [AuthorAssessedStatus.GRAY]: {
        label: i18n.t('Deprecated'),
        description: i18n.t('This model is not intended for use or has been deprecated.'),
        color: '#666666',
        rank: 4,
    },
};

const READINESS_FILTER_STATUSES = [
    AuthorAssessedStatus.GREEN,
    AuthorAssessedStatus.YELLOW,
    AuthorAssessedStatus.ORANGE,
    AuthorAssessedStatus.RED,
    AuthorAssessedStatus.GRAY,
];

const PERIOD_TYPE_LABELS: Record<string, string> = {
    month: i18n.t('Monthly'),
    MONTH: i18n.t('Monthly'),
    year: i18n.t('Yearly'),
    YEAR: i18n.t('Yearly'),
    week: i18n.t('Weekly'),
    WEEK: i18n.t('Weekly'),
    day: i18n.t('Daily'),
    DAY: i18n.t('Daily'),
    any: i18n.t('Any period'),
    ANY: i18n.t('Any period'),
};

const getReadiness = (model: ModelSpecRead): ReadinessConfig | undefined =>
    model.authorAssessedStatus
        ? READINESS_BY_STATUS[model.authorAssessedStatus]
        : undefined;

const normalizePeriodType = (periodType: unknown): string | undefined => (
    typeof periodType === 'string' ? periodType.toUpperCase() : undefined
);

const getPeriodLabel = (model: ModelSpecRead): string => {
    const key = model.supportedPeriodType as string | undefined;

    if (!key) {
        return i18n.t('Any period');
    }

    return PERIOD_TYPE_LABELS[key] ?? key;
};

const getModelName = (model: ModelSpecRead): string =>
    model.displayName || model.name;

const getModelOrganisation = (model: ModelSpecRead): string =>
    model.organization || i18n.t('Unknown organisation');

const DEFAULT_MODEL_LOGO_URL = '/default-model-logo.png';

const getModelLogoUrl = (model: ModelSpecRead): string =>
    model.organizationLogoUrl || DEFAULT_MODEL_LOGO_URL;

const sortByReadiness = (models: ModelSpecRead[]): ModelSpecRead[] =>
    [...models].sort((a, b) => {
        const rankA = getReadiness(a)?.rank ?? Number.MAX_SAFE_INTEGER;
        const rankB = getReadiness(b)?.rank ?? Number.MAX_SAFE_INTEGER;

        if (rankA !== rankB) {
            return rankA - rankB;
        }

        return getModelName(a).localeCompare(getModelName(b));
    });

const getCovariateFilterOptions = (models: ModelSpecRead[]): CovariateFilterOption[] => {
    const covariates = new Map<string, string>();

    models.forEach((model) => {
        model.covariates.forEach((covariate) => {
            if (!covariates.has(covariate.name)) {
                covariates.set(covariate.name, covariate.displayName);
            }
        });
    });

    return [...covariates.entries()]
        .map(([value, label]) => ({ label, value }))
        .sort((a, b) => a.label.localeCompare(b.label));
};

const modelSupportsAllCovariates = (model: ModelSpecRead, covariateFilters: string[]): boolean => {
    if (covariateFilters.length === 0) {
        return true;
    }

    const supportedCovariates = new Set(model.covariates.map(covariate => covariate.name));

    return covariateFilters.every(covariate => supportedCovariates.has(covariate));
};

export const ModelSelectionModal = ({
    models,
    selectedModel: initialSelectedModel,
    onClose,
    onConfirm,
}: Props) => {
    const [search, setSearch] = useState('');
    const [periodTypeFilter, setPeriodTypeFilter] = useState<string>();
    const [covariateFilters, setCovariateFilters] = useState<string[]>([]);
    const [statusFilters, setStatusFilters] = useState<string[]>([]);
    const [focusedId, setFocusedId] = useState<number | undefined>(() => initialSelectedModel?.id);

    const handleModalClose = () => {
        onClose();
    };

    const handleModelUse = (model: ModelSpecRead) => {
        onConfirm(model);
        handleModalClose();
    };

    const sortedModels = useMemo(
        () => sortByReadiness(models ?? []),
        [models],
    );

    const covariateFilterOptions = useMemo(
        () => getCovariateFilterOptions(sortedModels),
        [sortedModels],
    );

    const filteredModels = useMemo(() => {
        const query = search.trim().toLowerCase();

        return sortedModels.filter((model) => {
            const normalizedPeriodType = normalizePeriodType(model.supportedPeriodType);
            if (!normalizedPeriodType) {
                return false;
            }

            const matchesSearch = (
                !query
                || getModelName(model).toLowerCase().includes(query)
                || (model.description ?? '').toLowerCase().includes(query)
                || (model.author ?? '').toLowerCase().includes(query)
                || (model.organization ?? '').toLowerCase().includes(query)
            );
            const matchesPeriodType = (
                !periodTypeFilter
                || normalizedPeriodType === periodTypeFilter
                || normalizedPeriodType === PERIOD_TYPES.ANY
            );
            const matchesCovariates = modelSupportsAllCovariates(model, covariateFilters);
            const matchesStatus = (
                statusFilters.length === 0
                || (model.authorAssessedStatus && statusFilters.includes(model.authorAssessedStatus))
            );

            return matchesSearch && matchesPeriodType && matchesCovariates && matchesStatus;
        });
    }, [covariateFilters, periodTypeFilter, search, sortedModels, statusFilters]);

    const focusedModel = useMemo(
        () => filteredModels.find(model => model.id === focusedId),
        [filteredModels, focusedId],
    );

    const focusedReadiness = focusedModel ? getReadiness(focusedModel) : undefined;
    const selectedModelId = initialSelectedModel?.id.toString();
    const focusedModelId = focusedModel?.id.toString();
    const hasAuthorNote = focusedModel?.authorNote && focusedModel.authorNote !== 'No Author note yet';

    return (
        <Modal fluid onClose={handleModalClose}>
            <ModalTitle>{i18n.t('Select Model')}</ModalTitle>
            <ModalContent>
                <div className={styles.stage}>
                    <div className={styles.wrapper}>
                        <aside className={styles.rail}>
                            <div className={styles.controls}>
                                <Input
                                    dense
                                    placeholder={i18n.t('Search models')}
                                    value={search}
                                    onChange={({ value }) => setSearch(value ?? '')}
                                />
                                <div className={styles.filters}>
                                    <SingleSelect
                                        dense
                                        clearable
                                        clearText={i18n.t('Clear')}
                                        selected={periodTypeFilter ?? ''}
                                        prefix={i18n.t('Period type')}
                                        placeholder={i18n.t('Period type')}
                                        onChange={({ selected }) => setPeriodTypeFilter(selected || undefined)}
                                        dataTest="model-period-type-filter"
                                    >
                                        <MenuItem
                                            label={i18n.t('Monthly')}
                                            value={PERIOD_TYPES.MONTH}
                                        />
                                        <MenuItem
                                            label={i18n.t('Weekly')}
                                            value={PERIOD_TYPES.WEEK}
                                        />
                                    </SingleSelect>
                                    <MultiSelect
                                        dense
                                        selected={covariateFilters}
                                        placeholder={i18n.t('Covariates')}
                                        prefix={i18n.t('Covariates')}
                                        clearable
                                        clearText={i18n.t('Clear covariates')}
                                        collapseSelectionAfter={0}
                                        inputMaxHeight="26px"
                                        onChange={({ selected }) => setCovariateFilters(selected)}
                                        dataTest="model-covariates-filter"
                                    >
                                        {covariateFilterOptions.map(covariate => (
                                            <MultiSelectOption
                                                key={covariate.value}
                                                label={covariate.label}
                                                value={covariate.value}
                                            />
                                        ))}
                                    </MultiSelect>
                                    <MultiSelect
                                        dense
                                        selected={statusFilters}
                                        placeholder={i18n.t('Status')}
                                        prefix={i18n.t('Status')}
                                        clearable
                                        clearText={i18n.t('Clear statuses')}
                                        collapseSelectionAfter={0}
                                        inputMaxHeight="26px"
                                        onChange={({ selected }) => setStatusFilters(selected)}
                                        dataTest="model-status-filter"
                                    >
                                        {READINESS_FILTER_STATUSES.map(status => (
                                            <MultiSelectOption
                                                key={status}
                                                label={READINESS_BY_STATUS[status].label}
                                                value={status}
                                            />
                                        ))}
                                    </MultiSelect>
                                </div>
                            </div>

                            <ul className={styles.list}>
                                {filteredModels.map((model) => {
                                    const readiness = getReadiness(model);
                                    const isFocused = focusedModel?.id === model.id;
                                    const isSelected = selectedModelId === model.id.toString();
                                    const modelStableId = model.name || String(model.id);

                                    return (
                                        <li
                                            key={model.id}
                                            className={cn(styles.listItem, {
                                                [styles.listItemFocused]: isFocused,
                                            })}
                                        >
                                            <button
                                                type="button"
                                                className={styles.listButton}
                                                onClick={() => setFocusedId(model.id)}
                                                data-test={`model-inspect-${toDataTestKey(modelStableId)}`}
                                                aria-current={isFocused ? 'true' : undefined}
                                            >
                                                <span className={styles.listText}>
                                                    <span className={styles.listName}>{getModelName(model)}</span>
                                                    <span className={styles.listSubtitle}>{getModelOrganisation(model)}</span>
                                                </span>
                                                <span className={styles.listMeta}>
                                                    {readiness && (
                                                        <Tooltip content={readiness.description}>
                                                            <span
                                                                className={styles.listStatusDot}
                                                                style={{ backgroundColor: readiness.color }}
                                                                title={`${readiness.label}: ${readiness.description}`}
                                                                aria-label={`${i18n.t('Status')}: ${readiness.label}`}
                                                            />
                                                        </Tooltip>
                                                    )}
                                                    {isSelected && <IconCheckmark16 color="#1565c0" />}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                                {filteredModels.length === 0 && (
                                    <li className={styles.noResults}>{i18n.t('No models found')}</li>
                                )}
                            </ul>
                        </aside>

                        <section className={styles.detail}>
                            {focusedModel ? (
                                <>
                                    <div className={styles.detailBody}>
                                        <header className={styles.detailHeader}>
                                            <img
                                                className={styles.detailImage}
                                                src={getModelLogoUrl(focusedModel)}
                                                alt=""
                                                aria-hidden="true"
                                                onError={({ currentTarget }) => {
                                                    if (!currentTarget.src.endsWith(DEFAULT_MODEL_LOGO_URL)) {
                                                        currentTarget.src = DEFAULT_MODEL_LOGO_URL;
                                                    }
                                                }}
                                            />
                                            <div>
                                                <h3 className={styles.detailName}>{getModelName(focusedModel)}</h3>
                                            </div>
                                        </header>

                                        <p className={styles.detailDescription}>{focusedModel.description}</p>

                                        <dl className={styles.specs}>
                                            <div className={styles.spec}>
                                                <dt>
                                                    <IconCalendar16 color="#212934" />
                                                    {i18n.t('Period')}
                                                </dt>
                                                <dd>{getPeriodLabel(focusedModel)}</dd>
                                            </div>
                                            <div className={styles.spec}>
                                                <dt>
                                                    <IconArrowRight16 color="#212934" />
                                                    {i18n.t('Target')}
                                                </dt>
                                                <dd>{focusedModel.target?.displayName}</dd>
                                            </div>
                                            <div className={styles.spec}>
                                                <dt>
                                                    <IconDimensionData16 color="#212934" />
                                                    {i18n.t('Covariates')}
                                                </dt>
                                                <dd>
                                                    {focusedModel.covariates && focusedModel.covariates.length > 0
                                                        ? focusedModel.covariates.map(covariate => covariate.displayName).join(', ')
                                                        : i18n.t('None')}
                                                </dd>
                                            </div>
                                            <div className={styles.spec}>
                                                <dt>
                                                    <IconWorld16 color="#212934" />
                                                    {i18n.t('Author')}
                                                </dt>
                                                <dd>
                                                    {focusedModel.author || i18n.t('Unknown')}
                                                    {focusedModel.organization ? ` · ${focusedModel.organization}` : ''}
                                                </dd>
                                            </div>
                                            {focusedReadiness && (
                                                <div className={styles.spec}>
                                                    <dt>
                                                        <IconFlag16 color="#212934" />
                                                        {i18n.t('Status')}
                                                    </dt>
                                                    <dd>
                                                        <Tooltip content={focusedReadiness.description}>
                                                            <span className={styles.readinessPill}>
                                                                <span
                                                                    className={styles.readinessLegendDot}
                                                                    style={{ backgroundColor: focusedReadiness.color }}
                                                                />
                                                                {focusedReadiness.label}
                                                            </span>
                                                        </Tooltip>
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>

                                        {hasAuthorNote && (
                                            <div className={styles.authorNote}>
                                                <span className={styles.authorNoteLabel}>{i18n.t('Author note')}</span>
                                                {focusedModel.authorNote}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.detailActions}>
                                        <ButtonStrip end>
                                            <Button
                                                small
                                                primary={selectedModelId !== focusedModelId}
                                                onClick={() => handleModelUse(focusedModel)}
                                                icon={selectedModelId === focusedModelId ? <IconCheckmark16 /> : undefined}
                                                dataTest={`model-select-${toDataTestKey(focusedModel.name || String(focusedModel.id))}`}
                                            >
                                                {selectedModelId === focusedModelId
                                                    ? i18n.t('Selected')
                                                    : i18n.t('Use this model')}
                                            </Button>
                                        </ButtonStrip>
                                    </div>
                                </>
                            ) : (
                                <div className={styles.detailEmpty}>{i18n.t('Select a model from the left hand side')}</div>
                            )}
                        </section>
                    </div>
                </div>
            </ModalContent>
        </Modal>
    );
};
