#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// cli-app-scripts' package "exports" only expose the main entry, so resolve
// that and walk up to the package root to reach the internal lib modules.
const cliPkgDir = path.resolve(
    path.dirname(require.resolve('@dhis2/cli-app-scripts')),
    '..'
);
const i18n = require(path.join(cliPkgDir, 'src/lib/i18n'));
const makePaths = require(path.join(cliPkgDir, 'src/lib/paths'));
const { isApp } = require(path.join(cliPkgDir, 'src/lib/parseConfig'));

// Strip the POT-Creation-Date / PO-Revision-Date header lines so we can
// detect when an extract rewrite is pure timestamp churn.
const stripTimestamps = (contents) =>
    contents.replace(/^"(POT-Creation|PO-Revision)-Date: .*\\n"\n/gm, '');

const WORKSPACES = [
    'apps/modeling-app',
    'apps/early-warning-app',
    'apps/uncertainty-dashboard-plugin',
    'packages/ui',
];

async function main() {
    const root = path.resolve(__dirname, '..');
    let failed = false;

    for (const workspace of WORKSPACES) {
        const cwd = path.join(root, workspace);
        const paths = makePaths(cwd);
        const config = require(paths.config);
        const potPath = path.join(paths.i18nStrings, 'en.pot');
        const before = fs.existsSync(potPath)
            ? fs.readFileSync(potPath, 'utf8')
            : null;

        console.log(`\n[${workspace}] extracting i18n strings...`);
        try {
            const ok = await i18n.extract({
                input: paths.src,
                output: paths.i18nStrings,
                paths,
                isApp: isApp(config.type),
            });
            if (!ok) {
                console.error(`[${workspace}] extraction failed`);
                failed = true;
                continue;
            }
        } catch (err) {
            console.error(`[${workspace}] extraction threw:`, err.message);
            failed = true;
            continue;
        }

        // cli-app-scripts' own comparison sometimes rewrites the file with a
        // fresh timestamp even when no msgids changed. Keep the committed file
        // byte-stable in that case so we don't produce noise commits.
        if (before !== null && fs.existsSync(potPath)) {
            const after = fs.readFileSync(potPath, 'utf8');
            if (
                after !== before &&
                stripTimestamps(after) === stripTimestamps(before)
            ) {
                fs.writeFileSync(potPath, before);
                console.log(
                    `[${workspace}] no string changes (timestamp-only rewrite reverted)`
                );
            }
        }
    }

    if (failed) {
        process.exit(1);
    }
}

main();
