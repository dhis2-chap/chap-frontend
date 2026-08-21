import { useMemo, useState } from 'react';
import {
    Button,
    ButtonStrip,
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
    NoticeBox,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import {
    OrganisationUnit,
    OrganisationUnitSelector as OrgUnitSelector,
    SelectionChangeEvent,
    ouIdHelper,
} from '../../../../OrganisationUnitSelector';
import { useOrgUnitGroupLevels } from './hooks/useOrgUnitGroupLevels';
import styles from '../LocationSelector.module.css';

type Props = {
    orgUnitRoots: string[];
    selectedOrgUnits: OrganisationUnit[];
    onClose: () => void;
    onConfirm: (selectedOrgUnits: OrganisationUnit[]) => void;
};

export const OrganisationUnitSelectionModal = ({
    orgUnitRoots,
    selectedOrgUnits,
    onClose,
    onConfirm,
}: Props) => {
    const [pendingOrgUnits, setPendingOrgUnits] = useState<OrganisationUnit[]>(selectedOrgUnits);

    const handleOrgUnitSelect = (e: SelectionChangeEvent) => {
        setPendingOrgUnits(e.items);
    };

    const handleConfirm = () => {
        onConfirm(pendingOrgUnits);
    };

    const selectedGroupIds = useMemo(() => pendingOrgUnits
        .filter(ou => ouIdHelper.hasGroupPrefix(ou.id))
        .map(ou => ouIdHelper.removePrefix(ou.id)), [pendingOrgUnits]);

    const { groups, isLoading: isLoadingGroupLevels, error: groupLevelsError } = useOrgUnitGroupLevels(selectedGroupIds);
    const hasGroupLevelsError = selectedGroupIds.length > 0 && !!groupLevelsError;

    const isSameLevel = useMemo(() => {
        // Only consider org units that have paths
        const orgUnitsWithPath = pendingOrgUnits.filter(ou => ou.path);

        const orgUnitLevels = orgUnitsWithPath.map((ou) => {
            const pathSegments = ou.path!.split('/');
            return pathSegments.filter(segment => segment.length > 0).length;
        });

        const groupMemberLevels = groups
            .filter(group => selectedGroupIds.includes(group.id))
            .flatMap(group => group.organisationUnits.map(ou => ou.level));

        const allLevels = [...orgUnitLevels, ...groupMemberLevels];

        if (allLevels.length <= 1) {
            return true;
        }

        const firstLevel = allLevels[0];
        return allLevels.every(level => level === firstLevel);
    }, [pendingOrgUnits, groups, selectedGroupIds]);

    return (
        <Modal onClose={onClose} large>
            <ModalTitle>{i18n.t('Select Organisation Units')}</ModalTitle>
            <ModalContent>
                <div className={styles.noticeBox}>
                    <NoticeBox title={i18n.t('Organisation unit levels')}>
                        {i18n.t('Some models require you to only select organisation units from the same level.')}
                    </NoticeBox>
                </div>
                <OrgUnitSelector
                    roots={orgUnitRoots}
                    selected={pendingOrgUnits}
                    onSelect={handleOrgUnitSelect}
                    hideGroupSelect={false}
                    hideLevelSelect={false}
                    hideUserOrgUnits={true}
                    warning={
                        hasGroupLevelsError
                            ? i18n.t('Could not verify the levels of the org units in the selected groups')
                            : !isSameLevel
                                    ? i18n.t('All org units must be at the same level')
                                    : undefined
                    }
                />
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button onClick={onClose}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        onClick={handleConfirm}
                        disabled={!isSameLevel || isLoadingGroupLevels || hasGroupLevelsError}
                    >
                        {i18n.t('Confirm Selection')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
