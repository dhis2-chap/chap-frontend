import i18n from '@dhis2/d2-i18n';
import { Modal, Button, ModalTitle, ModalContent, ButtonStrip, ModalActions } from '@dhis2/ui';
import { VisualizationPlugin } from '../VisualizationPlugin';
import { OrganisationUnit } from '../OrganisationUnitSelector';
import { getPeriodIdsInRange, PERIOD_TYPES, toDhis2FixedPeriodType } from '@dhis2-chap/core';
import { useConfig } from '@dhis2/app-runtime';
import { CovariateMapping } from '../ModelExecutionForm/hooks/useModelExecutionFormState';
import { type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

type Props = {
    onClose: () => void;
    selectedOrgUnits: OrganisationUnit[];
    periodType: keyof typeof PERIOD_TYPES;
    fromPeriodId: string;
    toPeriodId: string;
    periodSettings: Dhis2PeriodSettings;
    covariateMappings: CovariateMapping[];
    targetMapping: CovariateMapping;
};

export const InspectDatasetModal = ({
    onClose,
    selectedOrgUnits,
    periodType,
    fromPeriodId,
    toPeriodId,
    periodSettings,
    covariateMappings,
    targetMapping,
}: Props) => {
    const { baseUrl } = useConfig();

    const calculatePeriods = () => {
        const selectedPeriodType = toDhis2FixedPeriodType(periodType);
        if (!selectedPeriodType) {
            return [];
        }

        return getPeriodIdsInRange({
            startPeriodId: fromPeriodId,
            endPeriodId: toPeriodId,
            calendar: periodSettings.calendar,
            locale: periodSettings.locale,
        }).map(id => ({ id }));
    };

    const calculateDataDimensions = () => {
        const dataDimensions = [
            {
                id: targetMapping.dataItem.id,
            },
            ...covariateMappings.map(mapping => ({
                id: mapping.dataItem.id,
            })),
        ];
        return dataDimensions;
    };

    const calculateOrgUnits = () => {
        return selectedOrgUnits.map(unit => ({
            id: unit.id,
        }));
    };

    return (
        <Modal
            large
            onClose={onClose}
        >
            <ModalTitle>{i18n.t('Inspect dataset')}</ModalTitle>
            <ModalContent>
                <VisualizationPlugin
                    pluginSource={`${baseUrl}/dhis-web-data-visualizer/plugin.html`}
                    height="500px"
                    forDashboard={true}
                    displayProperty="name"
                    visualization={{
                        type: 'PIVOT_TABLE',
                        columns: [
                            {
                                dimension: 'pe',
                                items: calculatePeriods(),
                            },
                        ],
                        rows: [
                            {
                                dimension: 'ou',
                                items: calculateOrgUnits(),
                            },
                            {
                                dimension: 'dx',
                                items: calculateDataDimensions(),
                            },
                        ],
                        filters: [],
                    }}
                />
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button
                        onClick={onClose}
                    >
                        {i18n.t('Close')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
