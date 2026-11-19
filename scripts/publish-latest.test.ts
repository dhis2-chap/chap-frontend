import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('./publish-latest.sh', import.meta.url));
let directory: string;

beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'publish-latest-'));
    mkdirSync(join(directory, 'apps/modeling-app/build/bundle'), { recursive: true });
    writeFileSync(join(directory, 'apps/modeling-app/build/bundle/app-7.6.1.zip'), 'app bundle');
    // Exercise the real shell script without calling GitHub.
    writeFileSync(join(directory, 'gh'), `#!/usr/bin/env node
const { appendFileSync } = require('node:fs');
const args = process.argv.slice(2);
appendFileSync(process.env.RUNNER_TEMP + '/calls.jsonl', JSON.stringify(args) + '\\n');
if (args[0] === 'api' && args[1].endsWith('/commits/main')) {
    console.log(process.env.MAIN_SHA);
}
if (args[0] === 'release' && args[1] === 'view') {
    process.exit(process.env.RELEASE_EXISTS === 'true' ? 0 : 1);
}
if (args[0] === 'release' && args[1] === 'upload' && process.env.UPLOAD_FAILS === 'true') {
    process.exit(1);
}
`, { mode: 0o755 });
});

afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
});

function publish(overrides: Record<string, string> = {}) {
    const result = spawnSync('bash', [script], {
        cwd: directory,
        encoding: 'utf8',
        env: {
            ...process.env,
            PATH: `${directory}:${process.env.PATH}`,
            RUNNER_TEMP: directory,
            GITHUB_REPOSITORY: 'example/modeling',
            GITHUB_SHA: 'current-commit',
            MAIN_SHA: 'current-commit',
            RELEASE_EXISTS: 'false',
            UPLOAD_FAILS: 'false',
            ...overrides,
        },
    });
    const calls: string[][] = readFileSync(join(directory, 'calls.jsonl'), 'utf8')
        .trim().split('\n').map(line => JSON.parse(line));
    return { ...result, calls };
}

describe('publishing the latest Modeling App build', () => {
    it('creates an unstable prerelease with a fixed asset name and the built commit', () => {
        const { status, calls } = publish();

        expect(status).toBe(0);
        expect(calls.at(-1)).toEqual([
            'release', 'create', 'latest', join(directory, 'modeling-app-latest.zip'),
            '--target', 'current-commit', '--title', 'Latest main build (unstable)',
            '--notes-file', join(directory, 'modeling-app-latest-notes.md'),
            '--prerelease', '--latest=false',
        ]);
        expect(readFileSync(join(directory, 'modeling-app-latest.zip'), 'utf8')).toBe('app bundle');
        expect(readFileSync(join(directory, 'modeling-app-latest-notes.md'), 'utf8'))
            .toContain('https://github.com/example/modeling/commit/current-commit');
    });

    it('replaces the existing asset, moves the tag, and updates the prerelease', () => {
        const { status, calls } = publish({ RELEASE_EXISTS: 'true' });

        expect(status).toBe(0);
        expect(calls.slice(2)).toEqual([
            ['release', 'upload', 'latest', join(directory, 'modeling-app-latest.zip'), '--clobber'],
            ['api', '--method', 'PATCH', 'repos/example/modeling/git/refs/tags/latest',
                '-f', 'sha=current-commit', '-F', 'force=true'],
            ['release', 'edit', 'latest', '--title', 'Latest main build (unstable)',
                '--notes-file', join(directory, 'modeling-app-latest-notes.md'),
                '--prerelease', '--latest=false'],
        ]);
    });

    it('skips outdated workflow runs without changing the release', () => {
        const { status, calls } = publish({ MAIN_SHA: 'newer-commit' });

        expect(status).toBe(0);
        expect(calls).toEqual([['api', 'repos/example/modeling/commits/main', '--jq', '.sha']]);
    });

    it('stops before moving the tag or updating notes if the upload fails', () => {
        const { status, calls } = publish({ RELEASE_EXISTS: 'true', UPLOAD_FAILS: 'true' });

        expect(status).not.toBe(0);
        expect(calls.at(-1)?.slice(0, 3)).toEqual(['release', 'upload', 'latest']);
    });
});
