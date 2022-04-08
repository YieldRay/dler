const download = require('../lib/dler.js');
const args = process.argv.slice(2);
if (args.length < 1) {
    console.log('Usage: dler <saveAs> <url>');
    process.exit(1);
}

const url = args[args.length - 1];
const saveAs = args[0] === url ? '' : args[0];
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
