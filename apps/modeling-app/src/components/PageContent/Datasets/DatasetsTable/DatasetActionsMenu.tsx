import { useState } from 'react';
import {
    FlyoutMenu,
    IconAdd16,
    IconMore16,
    IconView16,
    MenuItem,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { OverflowButton } from '@dhis2-chap/ui';
import { useNavigate } from 'react-router-dom';

type Props = {
    datasetId: number;
};

export const DatasetActionsMenu = ({ datasetId }: Props) => {
    const navigate = useNavigate();
    const [flyoutMenuIsOpen, setFlyoutMenuIsOpen] = useState(false);

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
                        dataTest="dataset-overflow-view"
                        icon={<IconView16 />}
                        onClick={() => navigate(`/datasets/${datasetId}`)}
                    />
                    <MenuItem
                        label={i18n.t('New evaluation')}
                        dataTest="dataset-overflow-new-evaluation"
                        icon={<IconAdd16 />}
                        onClick={() => navigate(`/evaluate/from-dataset?datasetId=${datasetId}`)}
                    />
                </FlyoutMenu>
            )}
        />
    );
};
