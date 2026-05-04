import { useState } from 'react';
import {
    FlyoutMenu,
    IconImportItems24,
    IconMore16,
    IconVisualizationLine24,
    MenuItem,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { OverflowButton } from '@dhis2-chap/ui';
import { useNavigate } from 'react-router-dom';

type Props = {
    configuredId?: string;
    predictionId: number;
};

export const PredictionRunActionsMenu = ({
    configuredId,
    predictionId,
}: Props) => {
    const navigate = useNavigate();
    const [flyoutMenuIsOpen, setFlyoutMenuIsOpen] = useState(false);

    const navigateToRunWorkflow = (workflow: 'import' | 'alerts') => {
        if (!configuredId) {
            return;
        }

        navigate(`/predictions/${configuredId}/runs/${predictionId}/${workflow}`);
        setFlyoutMenuIsOpen(false);
    };

    return (
        <OverflowButton
            small
            open={flyoutMenuIsOpen}
            icon={<IconMore16 />}
            onClick={() => setFlyoutMenuIsOpen(prev => !prev)}
            component={(
                <FlyoutMenu dense>
                    <MenuItem
                        label={i18n.t('Import')}
                        dataTest="prediction-run-overflow-import"
                        icon={<IconImportItems24 />}
                        onClick={() => navigateToRunWorkflow('import')}
                    />
                    <MenuItem
                        label={i18n.t('Outbreak thresholds')}
                        dataTest="prediction-run-overflow-alerts"
                        icon={<IconVisualizationLine24 />}
                        onClick={() => navigateToRunWorkflow('alerts')}
                    />
                </FlyoutMenu>
            )}
        />
    );
};
