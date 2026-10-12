import i18n from '@dhis2/d2-i18n';
import { getInterventions } from '../utils/interventions';
import { useSettings } from '../hooks/useSettings';

export const RecommendedActions = ({ orgUnitLevel, alertLevel }: { orgUnitLevel: number; alertLevel: string }) => {
    const { data } = useSettings();
    const actions = getInterventions(data?.interventions ?? [], orgUnitLevel, alertLevel);
    if (!actions.length) return null;
    return (
        <div>
            <strong>{i18n.t('Recommended actions')}</strong>
            <ul>{actions.map((action, index) => <li key={index}>{action}</li>)}</ul>
        </div>
    );
};
