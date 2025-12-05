import React, { useRef, useState } from 'react';
import {
    Button,
    FlyoutMenu,
    IconDelete16,
    IconEdit16,
    IconMore16,
    IconShare16,
    Layer,
    MenuItem,
    Popper,
    SharingDialog,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { EditRoute } from '../EditRoute';
import type { Route } from '../../../../hooks/useRoute';
import { DeleteRouteModal } from '../DeleteRouteModal';
import { useQueryClient } from '@tanstack/react-query';
import styles from './RouteActions.module.css';

type Props = {
    route: Route;
};

export const RouteActions = ({ route }: Props) => {
    const queryClient = useQueryClient();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSharingDialogOpen, setIsSharingDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const popperRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <div className={styles.routeActions}>
                <Button
                    icon={<IconShare16 />}
                    small
                    onClick={() => setIsSharingDialogOpen(true)}
                >
                    {i18n.t('Sharing')}
                </Button>

                <div ref={popperRef}>
                    <Button
                        small
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <IconMore16 />
                    </Button>
                    {isDropdownOpen && (
                        <Layer onBackdropClick={() => setIsDropdownOpen(false)}>
                            <Popper
                                placement="bottom-end"
                                reference={popperRef}
                            >
                                <FlyoutMenu>
                                    <MenuItem
                                        dense
                                        onClick={() => {
                                            setIsEditDialogOpen(true);
                                            setIsDropdownOpen(false);
                                        }}
                                        label={i18n.t('Edit')}
                                        icon={<IconEdit16 />}
                                    />
                                    <MenuItem
                                        dense
                                        onClick={() => {
                                            setIsSharingDialogOpen(true);
                                            setIsDropdownOpen(false);
                                        }}
                                        label={i18n.t('Sharing')}
                                        icon={<IconShare16 />}
                                    />
                                    <MenuItem
                                        dense
                                        destructive
                                        onClick={() => {
                                            setIsDeleteDialogOpen(true);
                                            setIsDropdownOpen(false);
                                        }}
                                        label={i18n.t('Delete')}
                                        icon={<IconDelete16 />}
                                    />
                                </FlyoutMenu>
                            </Popper>
                        </Layer>
                    )}
                </div>

            </div>
            {isSharingDialogOpen && (
                <SharingDialog
                    id={route.id}
                    type="route"
                    onClose={() => {
                        queryClient.invalidateQueries({ queryKey: ['routes'] });
                        setIsSharingDialogOpen(false);
                    }}
                />
            )}

            {isDeleteDialogOpen && (
                <DeleteRouteModal
                    routeId={route.id}
                    onClose={() => setIsDeleteDialogOpen(false)}
                />
            )}

            {isEditDialogOpen && (
                <EditRoute
                    route={route}
                    onClose={() => setIsEditDialogOpen(false)}
                />
            )}
        </>
    );
};
