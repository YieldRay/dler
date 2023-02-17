import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch';
import { AbortSignal } from 'node-fetch/externals';
import { promises as fs, constants, createWriteStream } from 'fs';
import { basename, dirname, resolve, join, normalize, isAbsolute } from 'path';
import { sep as SEP_POSIX } from 'path/posix';
import { sep as SEP_WIN32 } from 'path/win32';

interface DlerInit extends RequestInit {
    filePath?: string;
    maxDuration?: number;
    checkOK?: boolean;
    streamOptions?: Parameters<typeof createWriteStream>[1];
    onProgress?: (receivedLength?: number, totalLength?: number) => void;
    onReady?: (resp?: Response, saveAs?: string) => void | string;
}

const endsWithSep = (s: string) => s.endsWith(SEP_POSIX) || s.endsWith(SEP_WIN32);
const urlBasename = (u: string) => basename(new URL(u).pathname);

function resolveFilePath(filePath: string | undefined, url: string, contentType?: string | null): string {
    let rt = filePath
        ? // endsWith SEP mean to download to a folder, otherwise just set the file path
          normalize(endsWithSep(filePath) ? join(filePath, urlBasename(url)) : filePath)
        : // if filePath is not set, get it from basename of the URL
          urlBasename(url);

    // still cannot get file name
    if (!rt || endsWithSep(rt)) {
        // if response is html document, use default name 'index.html'
        if (contentType && contentType.startsWith('text/html')) rt = join(rt, 'index.html');
        // throw error
        else throw new Error(`Unable to determine file name, filePath: '${filePath}' is a directory and url: '${url}' ends with '/' `);
    }
    return normalize(isAbsolute(rt) ? rt : join(resolve(), rt));
}

async function makeSureDir(filePath: string) {
    const dirName = dirname(filePath);
    try {
        await fs.access(dirName, constants.R_OK | constants.W_OK);
    } catch (_) {
        await fs.mkdir(dirName, { recursive: true });
    }
}

async function download(input: RequestInfo): Promise<string>;
async function download(input: RequestInfo, filePath: string): Promise<string>;
async function download(input: RequestInfo, init: DlerInit): Promise<string>;
async function download(input: RequestInfo, init?: DlerInit | string): Promise<string> {
    const options = typeof init === 'object' ? init : {};
    let filePath = typeof init === 'string' ? init : options.filePath;
    if (options.maxDuration && options.maxDuration > 0) {
        // ! OPTIONS - maxDuration
        if (options.signal) throw new Error('Cannot set both maxDuration and signal');
        const controller = new AbortController();
        options.signal = controller.signal as AbortSignal;
        setTimeout(() => {
            controller.abort();
        }, options.maxDuration);
    }

    const response = await fetch(input, options);

    filePath = resolveFilePath(filePath, response.url, response.headers.get('content-type'));

    if (typeof options.onReady === 'function') {
        // ! OPTIONS - onReady
        const reset = options.onReady(response, filePath);
        if (typeof reset === 'string') {
            // ! OPTIONS - onReady - reset file path by given path
            if (reset.endsWith('/') || reset.endsWith('\\') || basename(reset).length === 0) throw new Error('Please set file name');
            filePath = reset;
        }
    }

    // ! OPTIONS - checkOK
    if (options.checkOK) {
        if (!response.ok) throw new Error(`Unexpected response ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length') || '';
    const totalLength = contentLength ? Number.parseInt(contentLength, 10) : 0;
    let receivedLength = 0;

    await makeSureDir(filePath); // make sure parent directory exists

    const writeFile = createWriteStream(filePath, options.streamOptions);

    if (response.body !== null) {
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
    }

    return resolve(filePath);
}

export default download;
