import { describe, expect, it } from 'vitest';
import { getDefaultSettings, hasReviewAuthority, normalizeSettings } from './settings';

describe('review settings and access', () => {
    it('only permits reviewers and superusers', () => {
        expect(hasReviewAuthority([])).toBe(false);
        expect(hasReviewAuthority(['F_CHAP_MODELING_APP'])).toBe(false);
        expect(hasReviewAuthority(['F_CHAP_EARLY_WARNING_APPROVE'])).toBe(true);
        expect(hasReviewAuthority(['ALL'])).toBe(true);
    });
    it('uses empty defaults until settings are saved', () => {
        expect(normalizeSettings({ levelColors: { high: '#ff0000' } })).toEqual({
            ...getDefaultSettings(), levelColors: { high: '#ff0000' },
        });
    });
});
