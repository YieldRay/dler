import { downloadInCLI } from '../src/dler.ts';

(async function () {
    await downloadInCLI('https://api.ip.sb/ip', './tmp/ip.txt');
})();
