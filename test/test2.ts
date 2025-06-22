import { downloadInCLI } from '../src/dler.ts';
import { Writable } from 'node:stream';

const bringYourOwnStream = new Writable({
    write(chunk, encoding, callback) {
        console.log({ chunk, encoding });
        callback();
    },
});

(async function () {
    await downloadInCLI('https://example.net', { bringYourOwnStream });
    await downloadInCLI('https://cdn.jsdelivr.net/npm/@ffmpeg/core-wasm/ffmpeg-core.wasm', { bringYourOwnStream });
    await downloadInCLI('https://unpkg.com/@ffmpeg/core-wasm/ffmpeg-core.wasm', { bringYourOwnStream });
    await downloadInCLI('https://api.ip.sb/ip', './tmp/ip.txt');
})();
