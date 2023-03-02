import { ReadStream } from 'fs';
import { downloadFromFetch } from '../lib/dler.js';

/**
 * Use built-in fetch
 * Run this in nodejs>=17
 */
async function test() {
    const path = await downloadFromFetch(fetch, 'https://example.net/test.html', {
        bodyConvertor: ReadStream.fromWeb,
        filePath: './tmp/',
    });
    console.log(path);
}

test();
