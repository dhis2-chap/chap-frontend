import { describe, expect, it } from 'vitest';
import { getRouteTokenSettings, getRouteUpdateMutation } from './routeMutation';
import type { Route } from './useRoute';

const route: Route = {
    id: 'a1234567890',
    name: 'CHAP',
    displayName: 'CHAP',
    code: 'chap',
    url: 'http://chap:8000/**',
    headers: { 'Content-Type': 'application/json', 'authorization': 'Bearer legacy' },
    authorities: [],
    sharing: { public: '--------' },
};

describe('route updates', () => {
    it('changes only the timeout or URL on a legacy route', () => {
        expect(getRouteUpdateMutation(route, { responseTimeoutSeconds: 30 }, 'api-token')).toEqual({
            resource: 'routes', type: 'json-patch', id: route.id,
            data: [{ op: 'add', path: '/responseTimeoutSeconds', value: 30 }],
        });
        expect(getRouteUpdateMutation(route, { url: 'http://new-chap/**', apiToken: '  ' }, 'api-token').data)
            .toEqual([{ op: 'add', path: '/url', value: 'http://new-chap/**' }]);
    });

    it('rejects unrelated edits when DHIS2 cannot preserve write-only credentials', () => {
        const encryptedRoute = { ...route, auth: { type: 'api-headers' } };
        expect(() => getRouteUpdateMutation(encryptedRoute, { responseTimeoutSeconds: 30 }, 'api-token'))
            .toThrow('Re-enter the CHAP API token');
        expect(() => getRouteUpdateMutation(encryptedRoute, { url: route.url, apiToken: ' ' }, 'api-token'))
            .toThrow('Re-enter the CHAP API token');
    });

    it('stores a replacement encrypted and removes legacy authorization headers', () => {
        expect(getRouteUpdateMutation({ ...route, auth: { type: 'api-headers' } }, { apiToken: ' new-token ' }, 'api-token').data)
            .toEqual([
                { op: 'add', path: '/headers', value: { 'Content-Type': 'application/json' } },
                { op: 'add', path: '/auth', value: { type: 'api-token', token: 'new-token' } },
            ]);
    });

    it('removes both encrypted and plain authentication only when explicitly requested', () => {
        expect(getRouteUpdateMutation({ ...route, auth: { type: 'api-headers' } }, { removeApiToken: true }, 'api-token').data)
            .toEqual([
                { op: 'add', path: '/headers', value: { 'Content-Type': 'application/json' } },
                { op: 'add', path: '/auth', value: null },
            ]);
    });

    it('uses encrypted authentication for new tokens, with a legacy fallback', () => {
        expect(getRouteTokenSettings({}, ' secret ', 'api-token')).toEqual({
            headers: {}, auth: { type: 'api-token', token: 'secret' },
        });
        expect(getRouteTokenSettings({}, ' secret ', 'api-headers')).toEqual({
            headers: {}, auth: { type: 'api-headers', headers: { Authorization: 'Bearer secret' } },
        });
        expect(getRouteTokenSettings({}, ' secret ', 'header')).toEqual({ headers: { Authorization: 'Bearer secret' } });
    });

    it('migrates a legacy token to encrypted Bearer headers for CHAP servers without ApiToken support', () => {
        expect(getRouteUpdateMutation(route, { apiToken: 'new-token' }, 'api-headers').data).toEqual([
            { op: 'add', path: '/headers', value: { 'Content-Type': 'application/json' } },
            { op: 'add', path: '/auth', value: { type: 'api-headers', headers: { Authorization: 'Bearer new-token' } } },
        ]);
    });

    it('keeps an encrypted route encrypted even if DHIS2 version detection says otherwise', () => {
        expect(getRouteUpdateMutation({ ...route, auth: { type: 'api-token' } }, { apiToken: 'new-token' }, 'header').data)
            .toContainEqual({ op: 'add', path: '/auth', value: { type: 'api-headers', headers: { Authorization: 'Bearer new-token' } } });
    });
});
