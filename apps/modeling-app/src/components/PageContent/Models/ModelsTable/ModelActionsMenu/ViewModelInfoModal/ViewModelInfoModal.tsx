import {
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
    Button,
    CircularLoader,
    NoticeBox,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Pill } from '@dhis2-chap/ui';
import { useConfiguredModelInfo } from '../hooks/useConfiguredModelInfo';
import styles from './ViewModelInfoModal.module.css';

type Props = {
    id: number;
    onClose: () => void;
};

const labelByPeriodType: Record<string, string> = {
    month: i18n.t('Monthly'),
    year: i18n.t('Yearly'),
    week: i18n.t('Weekly'),
    day: i18n.t('Daily'),
    any: i18n.t('Any'),
};

const assessmentLabels: Record<string, string> = {
    gray: i18n.t('Deprecated'),
    red: i18n.t('Experimental'),
    orange: i18n.t('Limited'),
    yellow: i18n.t('Testing'),
    green: i18n.t('Production'),
};

const formatValue = (value: unknown): string => {
    if (value === undefined || value === null || value === '') {
        return '—';
    }
    if (typeof value === 'boolean') {
        return value ? i18n.t('True') : i18n.t('False');
    }
    if (Array.isArray(value)) {
        return value.length ? value.join(', ') : '—';
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
};

export const ViewModelInfoModal = ({ id, onClose }: Props) => {
    const { info, error, isLoading } = useConfiguredModelInfo({ id });

    const template = info?.modelTemplate;
    const userOptions: Record<string, Record<string, unknown>> = (template?.userOptions as Record<string, Record<string, unknown>> | null | undefined) || {};
    const userOptionValues: Record<string, unknown> = (info?.userOptionValues as Record<string, unknown> | null | undefined) || {};

    const optionKeys = Array.from(new Set([
        ...Object.keys(userOptions),
        ...Object.keys(userOptionValues),
    ]));

    return (
        <Modal
            large
            onClose={onClose}
            dataTest="view-model-info-modal"
        >
            <ModalTitle>
                {info
                    ? i18n.t('Model details{{colon}} {{name}}', { colon: ':', name: info.displayName || info.name })
                    : i18n.t('Model details')}
            </ModalTitle>
            <ModalContent>
                {isLoading && (
                    <div className={styles.loading}>
                        <CircularLoader />
                    </div>
                )}
                {error && !isLoading && (
                    <NoticeBox error title={i18n.t('Error loading model details')}>
                        {error.message || i18n.t('An unknown error occurred')}
                    </NoticeBox>
                )}
                {info && template && !isLoading && (
                    <>
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>{i18n.t('General')}</h3>
                            <div className={styles.metaGrid}>
                                <span className={styles.metaLabel}>{i18n.t('Display name')}</span>
                                <span className={styles.metaValue}>{info.displayName || '—'}</span>

                                <span className={styles.metaLabel}>{i18n.t('Configuration name')}</span>
                                <span className={styles.metaValue}>{info.name}</span>

                                <span className={styles.metaLabel}>{i18n.t('Configured model ID')}</span>
                                <span className={styles.metaValue}>{info.id}</span>

                                <span className={styles.metaLabel}>{i18n.t('Author')}</span>
                                <span className={styles.metaValue}>{template.author || '—'}</span>

                                <span className={styles.metaLabel}>{i18n.t('Organization')}</span>
                                <span className={styles.metaValue}>{template.organization || '—'}</span>

                                <span className={styles.metaLabel}>{i18n.t('Contact')}</span>
                                <span className={styles.metaValue}>{template.contactEmail || '—'}</span>

                                <span className={styles.metaLabel}>{i18n.t('Status')}</span>
                                <span className={styles.metaValue}>
                                    {template.authorAssessedStatus
                                        ? assessmentLabels[template.authorAssessedStatus] || template.authorAssessedStatus
                                        : '—'}
                                </span>

                                <span className={styles.metaLabel}>{i18n.t('Archived')}</span>
                                <span className={styles.metaValue}>
                                    {info.archived
                                        ? <Pill variant="destructive">{i18n.t('Archived')}</Pill>
                                        : <Pill variant="info">{i18n.t('Active')}</Pill>}
                                </span>
                            </div>
                        </section>

                        {template.description && (
                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>{i18n.t('Description')}</h3>
                                <p className={styles.description}>{template.description}</p>
                            </section>
                        )}

                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>{i18n.t('Model template')}</h3>
                            <div className={styles.metaGrid}>
                                <span className={styles.metaLabel}>{i18n.t('Template name')}</span>
                                <span className={styles.metaValue}>{template.name}</span>

                                <span className={styles.metaLabel}>{i18n.t('Version')}</span>
                                <span className={styles.metaValue}>{template.version || '—'}</span>

                                <span className={styles.metaLabel}>{i18n.t('Supported period')}</span>
                                <span className={styles.metaValue}>
                                    {template.supportedPeriodType
                                        ? labelByPeriodType[template.supportedPeriodType] || template.supportedPeriodType
                                        : '—'}
                                </span>

                                <span className={styles.metaLabel}>{i18n.t('Target')}</span>
                                <span className={styles.metaValue}>{template.target || '—'}</span>

                                <span className={styles.metaLabel}>{i18n.t('Requires geo')}</span>
                                <span className={styles.metaValue}>
                                    {template.requiresGeo ? i18n.t('Yes') : i18n.t('No')}
                                </span>

                                {(template.minPredictionLength !== null && template.minPredictionLength !== undefined) && (
                                    <>
                                        <span className={styles.metaLabel}>{i18n.t('Min prediction length')}</span>
                                        <span className={styles.metaValue}>{template.minPredictionLength}</span>
                                    </>
                                )}
                                {(template.maxPredictionLength !== null && template.maxPredictionLength !== undefined) && (
                                    <>
                                        <span className={styles.metaLabel}>{i18n.t('Max prediction length')}</span>
                                        <span className={styles.metaValue}>{template.maxPredictionLength}</span>
                                    </>
                                )}
                                {template.documentationUrl && (
                                    <>
                                        <span className={styles.metaLabel}>{i18n.t('Documentation')}</span>
                                        <span className={styles.metaValue}>
                                            <a href={template.documentationUrl} target="_blank" rel="noreferrer">
                                                {template.documentationUrl}
                                            </a>
                                        </span>
                                    </>
                                )}
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>{i18n.t('Covariates')}</h3>
                            <div className={styles.metaGrid}>
                                <span className={styles.metaLabel}>{i18n.t('Required')}</span>
                                <span className={styles.metaValue}>
                                    {template.requiredCovariates && template.requiredCovariates.length > 0 ? (
                                        <div className={styles.pillRow}>
                                            {template.requiredCovariates.map(c => (
                                                <Pill key={`req-${c}`}>{c}</Pill>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className={styles.empty}>{i18n.t('None')}</span>
                                    )}
                                </span>

                                <span className={styles.metaLabel}>{i18n.t('Additional')}</span>
                                <span className={styles.metaValue}>
                                    {info.additionalContinuousCovariates && info.additionalContinuousCovariates.length > 0 ? (
                                        <div className={styles.pillRow}>
                                            {info.additionalContinuousCovariates.map(c => (
                                                <Pill key={`add-${c}`}>{c}</Pill>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className={styles.empty}>{i18n.t('None')}</span>
                                    )}
                                </span>

                                <span className={styles.metaLabel}>{i18n.t('Allow free additional')}</span>
                                <span className={styles.metaValue}>
                                    {template.allowFreeAdditionalContinuousCovariates ? i18n.t('Yes') : i18n.t('No')}
                                </span>
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>{i18n.t('User options')}</h3>
                            {optionKeys.length === 0 ? (
                                <span className={styles.empty}>{i18n.t('This model has no configurable user options.')}</span>
                            ) : (
                                <table className={styles.optionsTable}>
                                    <thead>
                                        <tr>
                                            <th>{i18n.t('Option')}</th>
                                            <th>{i18n.t('Type')}</th>
                                            <th>{i18n.t('Selected value')}</th>
                                            <th>{i18n.t('Default')}</th>
                                            <th>{i18n.t('Description')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {optionKeys.map((key) => {
                                            const schema = userOptions[key] || {};
                                            const isSet = Object.prototype.hasOwnProperty.call(userOptionValues, key);
                                            const selected = isSet ? userOptionValues[key] : schema.default;
                                            return (
                                                <tr key={key}>
                                                    <td><code>{key}</code></td>
                                                    <td>{schema.type !== undefined ? String(schema.type) : '—'}</td>
                                                    <td className={isSet ? styles.selectedValue : styles.defaultValue}>
                                                        {formatValue(selected)}
                                                        {!isSet && schema.default !== undefined && (
                                                            <>
                                                                {' '}
                                                                <span className={styles.empty}>
                                                                    (
                                                                    {i18n.t('default')}
                                                                    )
                                                                </span>
                                                            </>
                                                        )}
                                                    </td>
                                                    <td>{schema.default !== undefined ? formatValue(schema.default) : '—'}</td>
                                                    <td>{schema.description !== undefined ? String(schema.description) : '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </section>

                        {template.authorNote && template.authorNote !== 'No Author note yet' && (
                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>{i18n.t('Author note')}</h3>
                                <p className={styles.description}>{template.authorNote}</p>
                            </section>
                        )}

                        {template.citationInfo && (
                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>{i18n.t('Citation')}</h3>
                                <p className={styles.description}>{template.citationInfo}</p>
                            </section>
                        )}
                    </>
                )}
            </ModalContent>
            <ModalActions>
                <Button onClick={onClose} dataTest="close-view-model-info-button">
                    {i18n.t('Close')}
                </Button>
            </ModalActions>
        </Modal>
    );
};
