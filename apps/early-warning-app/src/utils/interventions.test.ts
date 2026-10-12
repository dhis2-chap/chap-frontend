import { expect, it } from 'vitest';
import { getInterventions } from './interventions';

it('matches both alert and organisation unit level', () => {
    const interventions = [
        { orgUnitLevel: 2, alertLevel: 'high', action: 'Prepare supplies' },
        { orgUnitLevel: 3, alertLevel: 'high', action: 'Contact clinics' },
        { orgUnitLevel: 2, alertLevel: 'low', action: 'Monitor' },
    ];
    expect(getInterventions(interventions, 2, 'high')).toEqual(['Prepare supplies']);
    expect(getInterventions(interventions, 1, 'high')).toEqual([]);
});
