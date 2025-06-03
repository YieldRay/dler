#!/usr/bin/env node

import process from 'node:process';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { sep as SEP_POSIX } from 'node:path/posix';
import { dirname, basename } from 'node:path';
import { downloadInCLI } from './cli.ts';

const DEFAULT_WIDTH = 50;

// https://nodejs.org/api/util.html#utilparseargsconfig
const { values, positionals } = parseArgs({
    options: {
        help: {
            type: 'boolean',
            multiple: false,
            short: 'h',
            default: false,
        },
        continue: {
            type: 'boolean',
            short: 'c',
            default: false,
        },
        dir: {
            type: 'string',
            short: 'd',
        },
        width: {
            type: 'string',
            short: 'w',
            default: String(DEFAULT_WIDTH),
        },
        version: {
            type: 'boolean',
            short: 'v',
            default: false,
        },
    },
    strict: true,
    allowPositionals: true,
});

if (values.help || positionals.length === 0) {
    help();
} else {
    main();
}

async function main() {
    const url = positionals[0];
    const filePath = positionals[positionals.length - 1] === url ? '' : positionals[positionals.length - 1];
    const { dir } = values;

    // run cli
    if (new RegExp('^https?://').test(url)) {
        const finalPath = await downloadInCLI(
            url,
            {
                filePath,
                tryResumption: values.continue,
                onReady: dir ? (_, saveAs) => dir + SEP_POSIX + basename(saveAs) : undefined,
            },
            Number(values.width) || DEFAULT_WIDTH,
        );
        console.log(`Downloaded to ${finalPath}`);
    } else {
        console.error('URL is not valid');
        process.exit(-1);
    }
}

function help() {
    // assert json will cause ExperimentalWarning. so we use this instead
    // import pkg from './package.json' assert { type: 'json' }
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const pkg = JSON.parse(readFileSync(`${__dirname}/../package.json`, 'utf-8'));

    console.log(`${pkg.name} v${pkg.version}

Usage:
    dler <url> [<filePath>]

Options:
    --continue, -c          Enable download resumption
    --dir, -d               Specify the directory to save the file
    --help, -h              Display this help message`);
}
