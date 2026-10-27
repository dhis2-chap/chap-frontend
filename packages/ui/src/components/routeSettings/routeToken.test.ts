import { describe, expect, it } from 'vitest';
import { getRouteTokenStorage, hasPlainTextRouteToken, hasRouteToken, removeRouteToken, supportsEncryptedRouteAuth } from './routeToken';

describe('Chap route token', () => {
    const headers = { 'Content-Type': 'application/json', 'authorization': 'Bearer saved-token', 'X-Custom': 'keep' };

    it('detects a bearer token without depending on header or scheme casing', () => {
        expect(hasRouteToken({ headers: { AUTHORIZATION: 'bearer secret' } })).toBe(true);
        expect(hasRouteToken({ headers: { Authorization: 'Basic secret' } })).toBe(false);
        expect(hasRouteToken({ headers: { Authorization: 'Bearer ' } })).toBe(false);
        expect(hasRouteToken()).toBe(false);
    });

    it('recognises encrypted headers without reading their secret', () => {
        expect(hasRouteToken({ headers: {}, auth: { type: 'api-headers' } })).toBe(true);
        expect(hasRouteToken({ headers: {}, auth: null })).toBe(false);
        expect(hasRouteToken({ headers: {}, auth: { type: 'api-token' } })).toBe(true);
    });

    it('flags readable tokens even when encrypted authentication is also configured', () => {
        for (const value of ['Bearer secret', 'apitoken secret']) {
            const route = { headers: { AUTHORIZATION: value }, auth: { type: 'api-token' } };
            expect(hasPlainTextRouteToken(route)).toBe(true);
            expect(hasRouteToken({ headers: route.headers })).toBe(true);
        }
        expect(hasPlainTextRouteToken({ headers: {} })).toBe(false);
        expect(hasPlainTextRouteToken({ headers: { Authorization: 'Bearer ' } })).toBe(false);
        expect(hasPlainTextRouteToken()).toBe(false);
    });

    it.each([
        [40, 6, false], [40, 7, true], [41, 0, false], [41, 3, false],
        [41, 4, true], [42, 0, true], [43, 0, true],
    ])('checks encrypted auth support in 2.%i.%i', (minor, patch, expected) => {
        expect(supportsEncryptedRouteAuth({ major: 2, minor, patch })).toBe(expected);
    });

    it.each([
        ['2.5.0', 'api-token'], ['2.5.0.dev0', 'api-token'], ['3.0.0', 'api-token'],
        ['2.4.0', 'api-headers'], [undefined, 'api-headers'],
    ])('stores tokens for Chap %s as %s', (chapVersion, expected) => {
        expect(getRouteTokenStorage({ major: 2, minor: 42, patch: 0 }, chapVersion)).toBe(expected);
    });

    it('never stores tokens when DHIS2 cannot encrypt route auth', () => {
        expect(getRouteTokenStorage({ major: 2, minor: 41, patch: 3 }, '2.5.0')).toBeUndefined();
        expect(getRouteTokenStorage(undefined, '2.5.0')).toBeUndefined();
    });

    it('removes case-insensitive authorization headers without mutation and preserves others', () => {
        expect(removeRouteToken(headers)).toEqual({ 'Content-Type': 'application/json', 'X-Custom': 'keep' });
        expect(headers.authorization).toBe('Bearer saved-token');
        expect(removeRouteToken()).toEqual({});
    });
});
