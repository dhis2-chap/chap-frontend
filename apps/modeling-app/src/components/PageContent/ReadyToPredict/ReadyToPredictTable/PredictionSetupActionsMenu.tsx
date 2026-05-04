import { useState } from 'react';
import {
    FlyoutMenu,
    IconMore16,
    IconView16,
    MenuItem,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { OverflowButton } from '@dhis2-chap/ui';
import { useNavigate } from 'react-router-dom';

type Props = {
    predictionSetupId: number;
};

export const PredictionSetupActionsMenu = ({ predictionSetupId }: Props) => {
    const navigate = useNavigate();
    const [flyoutMenuIsOpen, setFlyoutMenuIsOpen] = useState(false);

    const handleView = () => {
        navigate(`/predictions/${predictionSetupId}`);
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
                        label={i18n.t('View')}
                        dataTest="prediction-setup-overflow-view"
                        icon={<IconView16 />}
                        onClick={handleView}
                    />
                </FlyoutMenu>
            )}
        />
    );
};
