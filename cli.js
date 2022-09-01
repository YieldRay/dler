#!/usr/bin/env node
const download = require('./lib/dler.js');
const print = process.stdout.write.bind(process.stdout);
const path = require('path');

// utils
const printToStartOfLine = (() => {
    let lastLineLength = 0;
    return s => {
        const str = String(s);
        const neededLength = Math.max(lastLineLength - str.length, 0);
        print('\r' + str + ' '.repeat(neededLength) + '\b'.repeat(neededLength));
        lastLineLength = str.length;
    };
})();

// export a function that allow other program to use
function downloadInCLI(url, saveAs = './', printWidth = 50) {
    const filePath = path.isAbsolute(saveAs) ? saveAs : path.normalize(path.resolve() + '/' + saveAs);
    return download(url, {
        filePath,
        onProgress: (received, total) => {
            if (total === 0) {
                printToStartOfLine(`[received ${received} bytes] unknown%`);
            } else {
                const percentage = received / total;
                const text = `${received}/${total} = ${Math.floor(percentage * 100)}%`;
                const textWitdh = text.length;
                const barWidth = printWidth - textWitdh;
                const blocks = Math.round(percentage * barWidth);
                const spaces = barWidth - blocks;
                const bar = barWidth > 5 ? '[' + ('█'.repeat(blocks) + ' '.repeat(spaces)) + ']' : '';
                printToStartOfLine(bar + text);
            }
        },
    });
}
module.exports = downloadInCLI;

// parse two params: url, saveAs
const args = process.argv.slice(2);
if (args.length > 0) {
    if (args[0] === '--help' || args[0] === '-h') {
        console.log('Usage: dler <url> <saveAs>');
        process.exit(1);
    }
    const url = args[0];
    const saveAs = args[args.length - 1] === url ? '' : args[args.length - 1];
    // run cli
    if (new RegExp('^https?://').test(url)) {
        downloadInCLI(url, saveAs)
            .then(path => console.log(`\nDownloaded to ${path}`))
            .catch(console.error);
    } else {
        console.log('URL is not valid');
    }
}
