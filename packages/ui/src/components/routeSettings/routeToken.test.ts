import { describe, expect, it } from 'vitest';
import { hasRouteToken, supportsEncryptedRouteAuth, updateRouteToken } from './routeToken';

describe('CHAP route token', () => {
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

    it.each([
        [40, 6, false], [40, 7, true], [41, 0, false], [41, 3, false],
        [41, 4, true], [42, 0, true], [43, 0, true],
    ])('checks encrypted auth support in 2.%i.%i', (minor, patch, expected) => {
        expect(supportsEncryptedRouteAuth({ major: 2, minor, patch })).toBe(expected);
    });

    it('keeps the existing token when editing only the URL', () => {
        expect(updateRouteToken(headers, '')).toEqual(headers);
        expect(updateRouteToken(headers, '   ')).toEqual(headers);
    });

    it('replaces case-insensitive authorization headers without duplicates or mutation', () => {
        expect(updateRouteToken(headers, ' new-token ')).toEqual({
            'Content-Type': 'application/json',
            'X-Custom': 'keep',
            'Authorization': 'Bearer new-token',
        });
        expect(headers.authorization).toBe('Bearer saved-token');
    });

    it('removes the token only when explicitly requested and preserves other headers', () => {
        expect(updateRouteToken(headers, 'ignored', true)).toEqual({
            'Content-Type': 'application/json',
            'X-Custom': 'keep',
        });
    });

    it('supports creating routes with and without tokens', () => {
        expect(updateRouteToken(undefined, 'secret')).toEqual({ Authorization: 'Bearer secret' });
        expect(updateRouteToken()).toEqual({});
    });
});
