import { expect, it } from 'vitest';
import { OpenAPI } from '../../httpfunctions/core/OpenAPI';
import { ModelsService } from '../../httpfunctions/services/ModelsService';
import { SystemService } from '../../httpfunctions/services/SystemService';
import { getRouteTokenSettings, getRouteUpdateMutation } from './routeMutation';
import { hasPlainTextRouteToken, type RouteTokenStorage } from './routeToken';
import type { Route } from './useRoute';

// Opt-in: authenticated Chap reachable from DHIS2, with the URL on its route allowlist.
// Set ROUTE_AUTH_DHIS2_URL, ROUTE_AUTH_CHAP_URL, and CHAP_API_TOKEN.
const baseUrl = process.env.ROUTE_AUTH_DHIS2_URL;
const chapUrl = process.env.ROUTE_AUTH_CHAP_URL;
const token = process.env.CHAP_API_TOKEN;

it.skipIf(!baseUrl || !chapUrl || !token)('uses the generated client through real DHIS2 ApiToken authentication to Chap', async () => {
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
    const originalConfig = { ...OpenAPI };
    let id: string | undefined;
    try {
        const created = await api('routes', 'POST', {
            name: `Chap ApiToken regression ${Date.now()}`,
            url: chapUrl,
            sharing: { public: '--------' },
            ...getRouteTokenSettings({}, token!, 'api-token'),
        });
        expect(created.status).toBe(201);
        id = (await created.json()).response.uid;
        Object.assign(OpenAPI, { BASE: `${baseUrl}/api/routes/${id}/run`, USERNAME: username, PASSWORD: password });
        expect((await SystemService.systemInfoSystemInfoGet()).auth_required).toBe(true);
        const checkModels = () => ModelsService.listModelTemplatesV1CrudModelTemplatesGet();
        expect(Array.isArray(await checkModels())).toBe(true);

        const readRoute = async (): Promise<Route> => (await api(`routes/${id}?fields=id,url,headers,auth`)).json();
        const route = await readRoute();
        expect(route.auth).toEqual({ type: 'api-token' });
        expect(hasPlainTextRouteToken(route)).toBe(false);
        const update = async (changes: Parameters<typeof getRouteUpdateMutation>[1], storage: RouteTokenStorage = 'api-token') => {
            const mutation = getRouteUpdateMutation(await readRoute(), changes, storage);
            expect((await api(`routes/${id}`, 'PATCH', mutation.data)).status).toBe(200);
        };
        expect(() => getRouteUpdateMutation(route, { responseTimeoutSeconds: 30 }, 'api-token')).toThrow();
        await update({ responseTimeoutSeconds: 30, apiToken: token });
        expect(Array.isArray(await checkModels())).toBe(true);
        await update({ apiToken: token }, 'api-headers');
        expect((await readRoute()).auth).toEqual({ type: 'api-headers' });
        expect(Array.isArray(await checkModels())).toBe(true);
        await update({ apiToken: 'intentionally-invalid-token' });
        await expect(checkModels()).rejects.toMatchObject({ status: 401 });
        await update({ removeApiToken: true });
        await expect(checkModels()).rejects.toMatchObject({ status: 401 });

        // Verify that a working legacy route migrates without breaking requests.
        expect((await api(`routes/${id}`, 'PATCH', [
            { op: 'add', path: '/headers', value: { Authorization: `Bearer ${token}` } },
        ])).status).toBe(200);
        expect(hasPlainTextRouteToken(await readRoute())).toBe(true);
        expect(Array.isArray(await checkModels())).toBe(true);
        await update({ apiToken: token });
        expect((await readRoute()).auth).toEqual({ type: 'api-token' });
        expect(hasPlainTextRouteToken(await readRoute())).toBe(false);
        expect(Array.isArray(await checkModels())).toBe(true);
    } finally {
        Object.assign(OpenAPI, originalConfig);
        if (id) {
            expect((await api(`routes/${id}`, 'DELETE')).status).toBe(200);
        }
    }
}, 30_000);
