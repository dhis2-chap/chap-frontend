import i18n from '@dhis2/d2-i18n';
import type { Bulletin, Settings } from './settings';

export const MESSAGE_PLACEHOLDERS = ['count', 'prediction', 'alerts', 'decisions', 'orgUnit', 'reviewer', 'date', 'dashboard'];
export const getDefaultBulletin = (): Bulletin => ({
    name: i18n.t('Review bulletin'),
    sendOn: 'alerts', recipientUserGroupIds: [], notifyOrgUnitUsers: false,
    subjectTemplate: i18n.t('Early warning review for {prediction}'),
    bodyTemplate: i18n.t('{reviewer} reviewed {prediction} on {date}\n\n{alerts}\n\n{dashboard}'),
});
export const validateBulletinSettings = (settings: Settings) => {
    if (settings.bulletins.some(bulletin => !bulletin.name.trim() || !bulletin.subjectTemplate.trim() || !bulletin.bodyTemplate.trim())) {
        return i18n.t('Every bulletin needs a name, subject and message.');
    }
    if (settings.bulletins.some(bulletin => !bulletin.recipientUserGroupIds.length && !(bulletin.orgUnitLevel && bulletin.notifyOrgUnitUsers))) {
        return i18n.t('Choose at least one recipient for each bulletin.');
    }
};
