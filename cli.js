#!/usr/bin/env node
const download = require('./lib/dler.js');
const args = process.argv.slice(2);
if (args.length < 1) {
    console.log('Usage: dler <url> <saveAs>');
    process.exit(1);
}

const url = args[0];
const saveAs = args[args.length - 1] === url ? '' : args[args.length - 1];

if (new RegExp('^https?://').test(url)) {
    download(url, {
        filePath: saveAs,
        onProgress: (received, total) => {
            if (total === 0) {
                console.log(`[received ${received} bytes] unknown%`);
            } else {
                const percentage = received / total;
                const scale = 30;
                const blocks = Math.round(percentage * scale);
                const spaces = scale - blocks;
                const bar = '█'.repeat(blocks) + ' '.repeat(spaces);
                console.log(`[${bar}] ${Math.floor(percentage * 100)}%`);
            }
        },
    }).then(path => console.log(`Downloaded to ${path}`));
} else {
    console.log('URL is not valid');
}
