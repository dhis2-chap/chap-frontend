import fs from 'fs';
import path from 'path';
import { request, type APIRequestContext, test as setup } from '@playwright/test';
import { getAppOrigin } from './config';

const DEFAULT_DHIS2_BASE_URL = 'http://localhost:8080';
const DEFAULT_DHIS2_USERNAME = 'system';
const DEFAULT_DHIS2_PASSWORD = 'S&stem123!';
const AUTH_FILE = path.resolve(__dirname, '../../../playwright/.auth/user.json');

const normalizeBaseUrl = (url: string): string => url.replace(/\/+$/, '');

const isAuthenticated = async (requestContext: APIRequestContext): Promise<boolean> => {
    const meResponse = await requestContext.get('/api/me.json');
    if (!meResponse.ok()) {
        return false;
    }

    const contentType = meResponse.headers()['content-type'] ?? '';
    if (!contentType.includes('application/json')) {
        return false;
    }

    const me = (await meResponse.json()) as { username?: string };
    return Boolean(me?.username);
};

setup('authenticate', async () => {
    const dhis2BaseUrl = normalizeBaseUrl(
        process.env.E2E_DHIS2_BASE_URL ?? DEFAULT_DHIS2_BASE_URL,
    );
    const username = process.env.E2E_DHIS2_USERNAME ?? DEFAULT_DHIS2_USERNAME;
    const password = process.env.E2E_DHIS2_PASSWORD ?? DEFAULT_DHIS2_PASSWORD;

    fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

    const requestContext = await request.newContext({ baseURL: dhis2BaseUrl });

    const loginActionResponse = await requestContext.post(
        '/dhis-web-commons-security/login.action',
        {
            form: {
                j_username: username,
                j_password: password,
            },
        },
    );

    if (loginActionResponse.status() >= 400) {
        throw new Error(
            `DHIS2 login request failed (${loginActionResponse.status()}) at ${dhis2BaseUrl}.`,
        );
    }

    let authenticated = await isAuthenticated(requestContext);

    if (!authenticated) {
        const loginApiResponse = await requestContext.post('/api/auth/login', {
            data: {
                username,
                password,
            },
        });

        if (loginApiResponse.status() >= 400) {
            throw new Error(
                `DHIS2 login fallback failed (${loginApiResponse.status()}) at ${dhis2BaseUrl}.`,
            );
        }

        authenticated = await isAuthenticated(requestContext);
    }

    if (!authenticated) {
        throw new Error(
            `DHIS2 auth verification failed after login attempts at ${dhis2BaseUrl}.`,
        );
    }

    const storageState = await requestContext.storageState();
    const appOrigin = getAppOrigin();
    const localStorageEntry = {
        name: 'DHIS2_BASE_URL',
        value: dhis2BaseUrl,
    };
    const existingOrigin = storageState.origins.find(
        originState => originState.origin === appOrigin,
    );

    if (existingOrigin) {
        existingOrigin.localStorage = existingOrigin.localStorage.filter(
            item => item.name !== localStorageEntry.name,
        );
        existingOrigin.localStorage.push(localStorageEntry);
    } else {
        storageState.origins.push({
            origin: appOrigin,
            localStorage: [localStorageEntry],
        });
    }

    fs.writeFileSync(AUTH_FILE, JSON.stringify(storageState, null, 2));
    await requestContext.dispose();
});
