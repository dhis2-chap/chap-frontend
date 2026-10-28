import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, it } from 'vitest';
import { getRouteTokenSettings, getRouteUpdateMutation } from './routeMutation';
import { hasRouteToken } from './routeToken';
import type { Route } from './useRoute';

// Opt-in: use a local DHIS2 instance whose route allowlist includes the fixture host.
// ROUTE_AUTH_DHIS2_URL=http://localhost:8090 pnpm test routeAuth.integration
const baseUrl = process.env.ROUTE_AUTH_DHIS2_URL;

it.skipIf(!baseUrl)('keeps authenticated requests working through guarded route edits on real DHIS2', async () => {
    let token = 'clim-1417-fixture';
    let scheme = 'Bearer';
    const upstream = createServer((req, res) => {
        res.writeHead(req.headers.authorization === `${scheme} ${token}` ? 200 : 401, { 'Content-Type': 'application/json' });
        res.end('{}');
    });
    await new Promise<void>(resolve => upstream.listen(0, '0.0.0.0', resolve));
    const port = (upstream.address() as AddressInfo).port;
    const host = process.env.ROUTE_AUTH_UPSTREAM_HOST ?? 'host.docker.internal';
    const username = process.env.E2E_DHIS2_USERNAME ?? 'system';
    const password = process.env.E2E_DHIS2_PASSWORD ?? 'System123';
    const api = (path: string, method = 'GET', data?: unknown) => fetch(`${baseUrl}/api/${path}`, {
        method,
        headers: {
            'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
            'Content-Type': method === 'PATCH' ? 'application/json-patch+json' : 'application/json',
        },
        body: data === undefined ? undefined : JSON.stringify(data),
    });
    let id: string | undefined;
    try {
        const created = await api('routes', 'POST', {
            name: `CLIM-1417 regression ${Date.now()}`,
            url: `http://${host}:${port}/**`,
            ...getRouteTokenSettings({ 'X-Custom': 'keep' }, token, 'api-headers'),
        });
        expect(created.status).toBe(201);
        id = (await created.json()).response.uid;
        const readRoute = async (): Promise<Route> => {
            const response = await api(`routes/${id}?fields=id,name,url,headers,auth,authorities,sharing,responseTimeoutSeconds`);
            expect(response.status).toBe(200);
            return response.json();
        };
        let route = await readRoute();
        expect(route.auth).toEqual({ type: 'api-headers' });
        expect(hasRouteToken(route)).toBe(true);
        expect((await api(`routes/${id}/run/probe`)).status).toBe(200);

        // A timeout-only edit must never reach the backend that drops the secret.
        expect(() => getRouteUpdateMutation(route, { responseTimeoutSeconds: 30 }, 'api-token')).toThrow();
        expect((await api(`routes/${id}/run/probe`)).status).toBe(200);
        scheme = 'ApiToken';
        const timeout = getRouteUpdateMutation(route, { responseTimeoutSeconds: 30, apiToken: token }, 'api-token');
        expect((await api(`routes/${id}`, 'PATCH', timeout.data)).status).toBe(200);
        route = await readRoute();
        expect(route.responseTimeoutSeconds).toBe(30);
        expect(route.headers).toEqual({ 'X-Custom': 'keep' });
        expect(route.auth).toEqual({ type: 'api-token' });
        expect((await api(`routes/${id}/run/probe`)).status).toBe(200);

        token = 'clim-1417-replacement';
        const replacement = getRouteUpdateMutation(route, { url: route.url, apiToken: token }, 'api-token');
        expect((await api(`routes/${id}`, 'PATCH', replacement.data)).status).toBe(200);
        expect((await api(`routes/${id}/run/probe`)).status).toBe(200);
        const removal = getRouteUpdateMutation(route, { removeApiToken: true }, 'api-token');
        expect((await api(`routes/${id}`, 'PATCH', removal.data)).status).toBe(200);
        expect((await api(`routes/${id}/run/probe`)).status).toBe(401);

        scheme = 'Bearer';
        // Legacy tokens survive unrelated edits and migrate on explicit replacement.
        expect((await api(`routes/${id}`, 'PATCH', [
            { op: 'add', path: '/headers', value: { authorization: `Bearer ${token}` } },
        ])).status).toBe(200);
        route = await readRoute();
        expect(hasRouteToken(route)).toBe(true);
        const legacyTimeout = getRouteUpdateMutation(route, { responseTimeoutSeconds: 40 }, 'api-token');
        expect((await api(`routes/${id}`, 'PATCH', legacyTimeout.data)).status).toBe(200);
        expect((await api(`routes/${id}/run/probe`)).status).toBe(200);
        // Chap servers without ApiToken support keep Bearer, now encrypted.
        const migration = getRouteUpdateMutation(route, { apiToken: token }, 'api-headers');
        expect((await api(`routes/${id}`, 'PATCH', migration.data)).status).toBe(200);
        route = await readRoute();
        expect(route.headers).toEqual({});
        expect(route.auth).toEqual({ type: 'api-headers' });
        expect((await api(`routes/${id}/run/probe`)).status).toBe(200);

        scheme = 'ApiToken';
        const upgrade = getRouteUpdateMutation(route, { apiToken: token }, 'api-token');
        expect((await api(`routes/${id}`, 'PATCH', upgrade.data)).status).toBe(200);
        route = await readRoute();
        expect(route.auth).toEqual({ type: 'api-token' });
        expect((await api(`routes/${id}/run/probe`)).status).toBe(200);
    } finally {
        if (id) {
            expect((await api(`routes/${id}`, 'DELETE')).status).toBe(200);
        }
        await new Promise<void>((resolve, reject) => upstream.close(error => error ? reject(error) : resolve()));
    }
}, 30_000);
