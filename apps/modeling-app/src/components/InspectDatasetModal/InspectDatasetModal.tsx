import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { Modal, Button, ModalTitle, ModalContent, ButtonStrip, ModalActions } from '@dhis2/ui';
import { VisualizationPlugin } from '../VisualizationPlugin';
import { OrganisationUnit } from '../OrganisationUnitSelector';
import { toDHIS2PeriodData, PERIOD_TYPES } from '@dhis2-chap/ui';
import { useConfig } from '@dhis2/app-runtime';
import { CovariateMapping } from '../ModelExecutionForm/hooks/useModelExecutionFormState';

type Props = {
    onClose: () => void;
    selectedOrgUnits: OrganisationUnit[];
    periodType: keyof typeof PERIOD_TYPES;
    fromDate: string;
    toDate: string;
    covariateMappings: CovariateMapping[];
    targetMapping: CovariateMapping;
};

export const InspectDatasetModal = ({
    onClose,
    selectedOrgUnits,
    periodType,
    fromDate,
    toDate,
    covariateMappings,
    targetMapping,
}: Props) => {
    const { baseUrl } = useConfig();

    const calculatePeriods = () => {
        const selectedPeriodType = PERIOD_TYPES[periodType];
        if (!selectedPeriodType) return [];

        const dateRange = toDHIS2PeriodData(fromDate, toDate, selectedPeriodType.toLowerCase());
        return dateRange.map(period => ({
            id: period.id,
        }));
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
