import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch';
import { AbortSignal } from 'node-fetch/externals';
import { promises as fs, constants, createWriteStream } from 'fs';
import { basename, dirname, resolve, normalize } from 'path';

interface DlerInit extends RequestInit {
    filePath?: string;
    maxDuration?: number;
    onProgress?: (receivedLength?: number, totalLength?: number) => void;
    onReady?: (resp?: Response, saveAs?: string) => void | string;
}

function resolveFilePath(filePath: string | void, url: string): string {
    let rt: string;
    if (filePath) {
        if (filePath.endsWith('/') || filePath.endsWith('\\')) {
            rt = filePath + basename(new URL(url).pathname);
        } else {
            rt = filePath;
        }
        rt = normalize(rt);
    } else {
        rt = basename(new URL(url).pathname);
    }
    if (!rt) throw new Error('Unable to determine file name');
    return rt;
}

async function download(input: RequestInfo): Promise<string>;
async function download(input: RequestInfo, init: DlerInit): Promise<string>;
async function download(input: RequestInfo, init?: DlerInit): Promise<string> {
    const options = init || {};
    let { filePath } = options;
    if (options.maxDuration && options.maxDuration > 0) {
        // ! OPTIONS - maxDuration
        if (options.signal) throw new Error('Cannot use both maxDuration and signal');
        const controller = new AbortController();
        options.signal = controller.signal as AbortSignal;
        setTimeout(() => {
            controller.abort();
        }, options.maxDuration);
    }
    const response = await fetch(input, init);
    filePath = resolveFilePath(filePath, response.url);

    if (typeof options.onReady === 'function') {
        // ! OPTIONS - onReady
        const reset = options.onReady(response, filePath);
        if (typeof reset === 'string') {
            // ! OPTIONS - onReady - reset file path by given path
            if (reset.endsWith('/') || reset.endsWith('\\') || basename(reset).length === 0) throw new Error('Please set file name');
            filePath = reset;
        }
    }

    if (response.ok) {
        let contentLength = response.headers.get('content-length');
        const totalLength = contentLength ? parseInt(contentLength, 10) : 0;
        let receivedLength = 0;
        const dirName = dirname(filePath);
        try {
            await fs.access(dirName, constants.R_OK | constants.W_OK);
        } catch (_) {
            await fs.mkdir(dirName, { recursive: true });
        }
        const writeFile = createWriteStream(filePath);
        response.body.on('data', chunk => {
            writeFile.write(chunk);
            if (typeof options.onProgress === 'function') {
                // ! OPTIONS - onProgress
                receivedLength += chunk.length;
                options.onProgress(receivedLength, totalLength);
            }
        });
        await new Promise<void>((rs, rj) => {
            response.body.on('error', err => rj(err));
            response.body.on('end', () => {
                writeFile.end();
                rs();
            });
        });
        return resolve(filePath);
    } else {
        throw new Error(`Unexpected response ${response.statusText}`);
    }
}

export default download;
