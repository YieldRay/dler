import fetch, { RequestInfo, RequestInit } from 'node-fetch';
import { promises as fs, constants, createWriteStream } from 'fs';
import { basename, dirname, resolve } from 'path';

interface DlerInit extends RequestInit {
    filePath?: string;
    abortTimeout?: number;
    onProgress?: (receivedLength?: number, totalLength?: number) => void;
}

async function download(input: RequestInfo): Promise<string>;
async function download(input: RequestInfo, init: DlerInit): Promise<string>;
async function download(input: RequestInfo, init?: DlerInit): Promise<string> {
    const options = init || {};
    let { filePath, onProgress } = options;
    if (!options.signal && options.abortTimeout && options.abortTimeout > 0) {
        const controller = new AbortController();
        options.signal = controller.signal;
        setTimeout(() => {
            controller.abort();
        }, options.abortTimeout);
    }
    const response = await fetch(input, init);
    const { url } = response;

    if (filePath) {
        if (filePath.endsWith('/')) {
            filePath += basename(new URL(url).pathname);
        }
    } else {
        filePath = basename(new URL(url).pathname);
    }

    if (response.ok) {
        let contentLength = response.headers.get('content-length');
        const totalLength = contentLength ? parseInt(contentLength, 10) : 0;
        let receivedLength = 0;
        // TODO: support resume download
        const dirName = dirname(filePath);
        try {
            await fs.access(dirName, constants.R_OK | constants.W_OK);
        } catch (_) {
            await fs.mkdir(dirName, { recursive: true });
        }
        const writeFile = createWriteStream(filePath);
        response.body.on('data', chunk => {
            writeFile.write(chunk);
            if (typeof onProgress === 'function') {
                receivedLength += chunk.length;
                onProgress(receivedLength, totalLength);
            }
        });
        await new Promise<void>((rs, rj) => {
            response.body.on('error', err => {
                rj(err);
            });
            response.body.on('end', () => {
                writeFile.end();
                rs();
            });
        });
        return resolve(filePath);
    } else {
        throw new Error(`unexpected response ${response.statusText}`);
    }
}

export default download;
