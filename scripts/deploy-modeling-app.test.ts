import { execFile } from 'node:child_process';
import { once } from 'node:events';
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { parse } from 'yaml';

const root = fileURLToPath(new URL('../', import.meta.url));
const workflow = parse(await readFile(join(root, '.github/workflows/deploy-modeling-app.yml'), 'utf8'));
const deploy = workflow.jobs.deploy.steps.find((step: { id?: string }) => step.id === 'deploy');
const appDirectory = join(root, deploy['working-directory']);
const appPackage = JSON.parse(await readFile(join(appDirectory, 'package.json'), 'utf8'));
const run = promisify(execFile);
const bundle = 'test Modeling App bundle';

let directory: string;
let baseUrl: string;
let uploadStatus: number;
let requests: { method: string | undefined; url: string | undefined; auth: string | undefined; body: string }[];
let server: ReturnType<typeof createServer>;

beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'modeling-deploy-'));
    // Use the real app configuration and deploy script, with a small upload fixture.
    await writeFile(join(directory, 'package.json'), JSON.stringify(appPackage));
    await copyFile(join(appDirectory, 'd2.config.js'), join(directory, 'd2.config.js'));
    await symlink(join(root, 'node_modules'), join(directory, 'node_modules'), 'dir');
    await mkdir(join(directory, 'build/bundle'), { recursive: true });
    const name = appPackage.name.replace('@', '').replace('/', '-');
    await writeFile(join(directory, `build/bundle/${name}-${appPackage.version}.zip`), bundle);

    requests = [];
    uploadStatus = 200;
    server = createServer(async (request, response) => {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        requests.push({
            method: request.method,
            url: request.url,
            auth: request.headers.authorization,
            body: Buffer.concat(chunks).toString(),
        });
        response.setHeader('Content-Type', 'application/json');
        response.statusCode = request.method === 'POST' ? uploadStatus : 200;
        response.end(JSON.stringify({ version: '2.42.0' }));
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/climate-demo-dev`;
});

afterEach(async () => {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await rm(directory, { recursive: true, force: true });
});

function runDeploy(password = 'test-password') {
    // Execute the workflow's actual shell command, pointing only the destination
    // and credentials at a local server. No connection to the shared demo instance.
    return run('bash', ['-e', '-o', 'pipefail', '-c', deploy.run], {
        cwd: directory,
        env: {
            ...process.env,
            CI: 'true',
            DHIS2_BASE_URL: baseUrl,
            D2_USERNAME: 'test-user',
            D2_PASSWORD: password,
        },
        timeout: 10_000,
    });
}

it('uploads the app bundle with authentication and checks the installed app', async () => {
    await expect(runDeploy()).resolves.toBeDefined();
    expect(requests.map(request => [request.method, request.url])).toEqual([
        ['GET', '/climate-demo-dev/api/system/info.json'],
        ['POST', '/climate-demo-dev/api/apps'],
        ['GET', '/climate-demo-dev/api/apps/dhis2-chapmodeling-app/'],
    ]);
    const upload = requests[1];
    expect(upload.auth).toBe(`Basic ${Buffer.from('test-user:test-password').toString('base64')}`);
    expect(upload.body).toContain('name="file"');
    expect(upload.body).toContain(bundle);
}, 15_000);

it('fails the deployment when DHIS2 rejects the upload', async () => {
    uploadStatus = 403;
    await expect(runDeploy()).rejects.toMatchObject({ code: 1 });
    expect(requests.map(request => request.method)).toEqual(['GET', 'POST']);
}, 15_000);

it('fails without prompting or contacting DHIS2 when credentials are missing', async () => {
    await expect(runDeploy('')).rejects.toMatchObject({ code: 1 });
    expect(requests).toHaveLength(0);
}, 15_000);
