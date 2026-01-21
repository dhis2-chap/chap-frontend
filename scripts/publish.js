#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '..', 'apps', 'modeling-app');
const BUNDLE_DIR = path.join(APP_DIR, 'build', 'bundle');
const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');
const ROOT_PACKAGE = require(path.join(__dirname, '..', 'package.json'));

const DRY_RUN = process.argv.includes('--dry-run');

function log(message) {
    const prefix = DRY_RUN ? '[DRY-RUN] ' : '';
    console.log(`${prefix}${message}`);
}

function validatePreConditions() {
    log('Validating pre-conditions...');
    const d2ConfigPath = path.join(APP_DIR, 'd2.config.js');
    if (!fs.existsSync(d2ConfigPath)) {
        throw new Error('Missing d2.config.js in apps/modeling-app');
    }

    const d2Config = require(d2ConfigPath);
    if (!d2Config.id) {
        throw new Error('d2.config.js missing required "id" field');
    }
    if (!d2Config.minDHIS2Version) {
        throw new Error('d2.config.js missing required "minDHIS2Version" field');
    }

    if (!DRY_RUN) {
        if (!process.env.D2_APP_HUB_TOKEN) {
            throw new Error('D2_APP_HUB_TOKEN environment variable not set');
        }
    }

    log(`  d2.config.js: OK (id=${d2Config.id}, minDHIS2Version=${d2Config.minDHIS2Version})`);
    return d2Config;
}

async function main() {
    if (DRY_RUN) {
        console.log('=== DRY RUN MODE - No actual publishing will occur ===\n');
    }

    const d2Config = validatePreConditions();
    const version = ROOT_PACKAGE.version;
    const tag = `v${version}`;

    log(`Publishing version ${version}...`);

    if (fs.existsSync(BUNDLE_DIR)) {
        log('Cleaning bundle directory...');
        if (!DRY_RUN) {
            fs.rmSync(BUNDLE_DIR, { recursive: true, force: true });
        }
    }

    log('Building...');
    execSync('pnpm build', { stdio: 'inherit' });

    if (!fs.existsSync(BUNDLE_DIR)) {
        throw new Error('Bundle directory not found in build/bundle');
    }

    const bundleFiles = fs.readdirSync(BUNDLE_DIR)
        .filter(f => f.endsWith('.zip'))
        .map(f => path.join(BUNDLE_DIR, f));

    if (bundleFiles.length === 0) {
        throw new Error('No bundle zip files found in build/bundle');
    }
    log(`  Bundle files: ${bundleFiles.map(f => path.basename(f)).join(', ')}`);

    const baseUrl = process.env.APPHUB_BASE_URL || 'https://apps.dhis2.org';
    const channel = process.env.APPHUB_CHANNEL || 'stable';

    log(`Publishing to App Hub (channel: ${channel})...`);
    if (!DRY_RUN) {
        execSync(`pnpm d2-app-scripts publish --channel ${channel}`, {
            cwd: APP_DIR,
            stdio: 'inherit',
            env: { ...process.env }
        });
    }
    log(`  App Hub: ${baseUrl}/app/${d2Config.id}`);

    log(`Creating GitHub release ${tag}...`);
    const releaseNotes = extractChangelogForVersion(version);

    if (!DRY_RUN) {
        const releaseNotesFile = '/tmp/release-notes.md';
        fs.writeFileSync(releaseNotesFile, releaseNotes);

        execSync(
            `gh release create "${tag}" ${bundleFiles.map(f => `"${f}"`).join(' ')} ` +
            `--title "v${version}" --notes-file "${releaseNotesFile}"`,
            { stdio: 'inherit' }
        );

        fs.unlinkSync(releaseNotesFile);
    } else {
        log(`  Would create release with notes:\n${releaseNotes.slice(0, 200)}...`);
    }

    log(`\nSuccessfully published ${version}`);
}

function extractChangelogForVersion(version) {
    if (!fs.existsSync(CHANGELOG_PATH)) {
        return `Release v${version}`;
    }

    const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
    const sections = changelog.split(/^## /m);

    const versionSection = sections.find(section =>
        section.startsWith(version) || section.startsWith(`${version}\n`)
    );

    return versionSection
        ? `## ${versionSection.trim()}`
        : `Release v${version}`;
}

main().catch(err => {
    console.error('Publish failed:', err.message);
    process.exit(1);
});
