import { describe, expect, it } from 'vitest';
import { hasRouteToken, updateRouteToken } from './routeToken';

describe('CHAP route token', () => {
    const headers = { 'Content-Type': 'application/json', 'authorization': 'Bearer saved-token', 'X-Custom': 'keep' };

    it('detects a bearer token without depending on header or scheme casing', () => {
        expect(hasRouteToken({ AUTHORIZATION: 'bearer secret' })).toBe(true);
        expect(hasRouteToken({ Authorization: 'Basic secret' })).toBe(false);
        expect(hasRouteToken({ Authorization: 'Bearer ' })).toBe(false);
        expect(hasRouteToken()).toBe(false);
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
