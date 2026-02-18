import fs from 'fs';
import path from 'path';
import { request } from '@playwright/test';
import { getAppOrigin } from './config';

const DEFAULT_DHIS2_BASE_URL = 'http://localhost:8080';
const DEFAULT_DHIS2_USERNAME = 'system';
const DEFAULT_DHIS2_PASSWORD = 'S&stem123!';

const normalizeBaseUrl = (url: string): string => url.replace(/\/+$/, '');

const isAuthenticated = async (
    requestContext: Awaited<ReturnType<typeof request.newContext>>,
): Promise<boolean> => {
    const meResponse = await requestContext.get('/api/me.json');
    if (!meResponse.ok()) {
        return false;
    }

    const contentType = meResponse.headers()['content-type'] ?? '';
    if (!contentType.includes('application/json')) {
        return false;
    }

    const me = (await meResponse.json()) as { username?: string };
    if (!me?.username) {
        return false;
    }

    return true;
};

async function globalSetup() {
    const dhis2BaseUrl = normalizeBaseUrl(
        process.env.E2E_DHIS2_BASE_URL ?? DEFAULT_DHIS2_BASE_URL,
    );
    const username = process.env.E2E_DHIS2_USERNAME ?? DEFAULT_DHIS2_USERNAME;
    const password = process.env.E2E_DHIS2_PASSWORD ?? DEFAULT_DHIS2_PASSWORD;

    // #region agent log
    fetch('http://127.0.0.1:7500/ingest/4f894227-fdd6-48cb-9d0c-4b19a40eab48',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f2aaee'},body:JSON.stringify({sessionId:'f2aaee',runId:'pre',hypothesisId:'B',location:'apps/modeling-app/e2e/global.setup.ts:setup-start',message:'Starting globalSetup',data:{ci:process.env.CI ?? null,dhis2BaseUrl,appOrigin:getAppOrigin(),hasE2eAppUrl:!!process.env.E2E_APP_URL,hasE2eDhis2BaseUrl:!!process.env.E2E_DHIS2_BASE_URL,username},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const authFile = path.resolve(__dirname, '.auth', 'user.json');
    fs.mkdirSync(path.dirname(authFile), { recursive: true });

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

    // #region agent log
    fetch('http://127.0.0.1:7500/ingest/4f894227-fdd6-48cb-9d0c-4b19a40eab48',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f2aaee'},body:JSON.stringify({sessionId:'f2aaee',runId:'pre',hypothesisId:'C',location:'apps/modeling-app/e2e/global.setup.ts:login-action',message:'DHIS2 login.action response',data:{status:loginActionResponse.status(),ok:loginActionResponse.ok(),dhis2BaseUrl},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

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

        // #region agent log
        fetch('http://127.0.0.1:7500/ingest/4f894227-fdd6-48cb-9d0c-4b19a40eab48',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f2aaee'},body:JSON.stringify({sessionId:'f2aaee',runId:'pre',hypothesisId:'C',location:'apps/modeling-app/e2e/global.setup.ts:login-api-fallback',message:'DHIS2 /api/auth/login response',data:{status:loginApiResponse.status(),ok:loginApiResponse.ok(),dhis2BaseUrl},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        if (loginApiResponse.status() >= 400) {
            throw new Error(
                `DHIS2 login fallback failed (${loginApiResponse.status()}) at ${dhis2BaseUrl}.`,
            );
        }

        authenticated = await isAuthenticated(requestContext);
    }

    // #region agent log
    fetch('http://127.0.0.1:7500/ingest/4f894227-fdd6-48cb-9d0c-4b19a40eab48',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f2aaee'},body:JSON.stringify({sessionId:'f2aaee',runId:'pre',hypothesisId:'C',location:'apps/modeling-app/e2e/global.setup.ts:auth-check',message:'DHIS2 authentication verification result',data:{authenticated,dhis2BaseUrl},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

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

    // #region agent log
    fetch('http://127.0.0.1:7500/ingest/4f894227-fdd6-48cb-9d0c-4b19a40eab48',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f2aaee'},body:JSON.stringify({sessionId:'f2aaee',runId:'pre',hypothesisId:'B',location:'apps/modeling-app/e2e/global.setup.ts:storage-state',message:'Wrote storageState for appOrigin',data:{appOrigin,dhis2BaseUrl,originCount:storageState.origins.length,origins:storageState.origins.map(o=>o.origin)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
    await requestContext.dispose();
}

export default globalSetup;
