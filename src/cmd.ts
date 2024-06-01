#!/usr/bin/env node

import process from 'node:process';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { downloadInCLI } from './cli.js';

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
        width: {
            type: 'string',
            short: 'w',
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

function main() {
    const url = positionals[0];
    const saveAs = positionals[positionals.length - 1] === url ? '' : positionals[positionals.length - 1];

    // run cli
    if (new RegExp('^https?://').test(url)) {
        downloadInCLI(url, { filePath: saveAs, tryResumption: values.continue }, Number(values.width) || 50)
            .then(path => console.log(`Downloaded to ${path}`))
            .catch(console.error);
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

    console.error(`${pkg.name} v${pkg.version}

Usage:
    dler <url> [<saveAs>]    
Options:
    --continue, c           Enable download resumption
    --help, c               Print this message`);
    process.exit(1);
}
