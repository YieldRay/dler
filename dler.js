#!/usr/bin/env node

// parse two params: url, saveAs
const args = process.argv.slice(2);
if (args.length <= 0 || args[0] === '--help' || args[0] === '-h') {
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
