import React, { useState } from 'react';
import {
    FlyoutMenu,
    MenuItem,
    IconView16,
    IconMore16,
    IconEdit16,
    IconDelete16,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { OverflowButton } from '@dhis2-chap/ui';

type Props = {
    id: number;
    name: string;
};

export const ModelActionsMenu = ({ id, name }: Props) => {
    const [flyoutMenuIsOpen, setFlyoutMenuIsOpen] = useState(false);

    return (
        <OverflowButton
            small
            open={flyoutMenuIsOpen}
            icon={<IconMore16 />}
            onClick={() => setFlyoutMenuIsOpen(prev => !prev)}
            component={
                <FlyoutMenu dense>
                    <MenuItem
                        label={i18n.t('View evaluations')}
                        dataTest={'model-overflow-view'}
                        icon={<IconView16 />}
                        onClick={() => setFlyoutMenuIsOpen(false)}
                    />
                    <MenuItem
                        label={i18n.t('Rename')}
                        dataTest={'model-overflow-rename'}
                        icon={<IconEdit16 />}
                        onClick={() => setFlyoutMenuIsOpen(false)}
                    />
                    <MenuItem
                        label={i18n.t('Delete')}
                        dataTest={'model-overflow-delete'}
                        destructive
                        icon={<IconDelete16 />}
                        onClick={() => setFlyoutMenuIsOpen(false)}
                    />
                </FlyoutMenu>
            }
        />
    );
};


