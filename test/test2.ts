import { downloadInCLI } from '../src/dler';

(async function () {
    await downloadInCLI('https://api.ip.sb/ip', './tmp/ip.txt');
})();
