import { useDataEngine } from '@dhis2/app-runtime';
import { useMutation } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { useCurrentUser } from './useCurrentUser';
import type { BulletinMessage } from '../utils/bulletins';

export const useSendBulletin = () => {
    const engine = useDataEngine();
    const { canApprove } = useCurrentUser();
    return useMutation({
        mutationFn: async (message: BulletinMessage) => {
            if (!canApprove) throw new Error(i18n.t('Review permission is required to send bulletins.'));
            if (!message.subject.trim() || !message.text.trim()) throw new Error(i18n.t('Provide a bulletin subject and message.'));
            if (!message.userGroupIds.length && !message.orgUnitIds.length) throw new Error(i18n.t('Choose at least one bulletin recipient.'));
            return engine.mutate({ resource: 'messageConversations', type: 'create', data: {
                subject: message.subject, text: message.text,
                userGroups: message.userGroupIds.map(id => ({ id })),
                organisationUnits: message.orgUnitIds.map(id => ({ id })),
            } });
        },
    });
};
