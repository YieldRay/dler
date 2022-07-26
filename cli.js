#!/usr/bin/env node
const download = require('./lib/dler.js');
const print = process.stdout.write.bind(process.stdout);

const args = process.argv.slice(2);
if (args.length < 1 || args[0] === '--help') {
    console.log('Usage: dler <url> <saveAs>');
    process.exit(1);
}

const url = args[0];
const saveAs = args[args.length - 1] === url ? '' : args[args.length - 1];
const printToStartOfLine = (() => {
    let lastLineLength = 0;
    return s => {
        const str = String(s);
        const neededLength = Math.max(lastLineLength - str.length, 0);
        print('\r' + str + ' '.repeat(neededLength) + '\b'.repeat(neededLength));
        lastLineLength = str.length;
    };
})();

if (new RegExp('^https?://').test(url)) {
    download(url, {
        filePath: saveAs,
        onProgress: (received, total) => {
            if (total === 0) {
                printToStartOfLine(`[received ${received} bytes] unknown%`);
            } else {
                const percentage = received / total;
                const scale = 30;
                const blocks = Math.round(percentage * scale);
                const spaces = scale - blocks;
                const bar = '█'.repeat(blocks) + ' '.repeat(spaces);
                printToStartOfLine(`[${bar}] ${received}/${total} = ${Math.floor(percentage * 100)}%`);
            }
        },
    })
        .then(path => console.log(`\nDownloaded to ${path}`))
        .catch(console.error);
} else {
    console.log('URL is not valid');
}
