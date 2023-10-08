import { downloadInCLI } from '../lib/dler.js';

async function test() {
    await downloadInCLI('https://api.ip.sb/ip', './tmp/ip.txt');
}

test();
