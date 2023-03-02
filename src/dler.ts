import fetch, { RequestInfo, RequestInit, Response, Headers } from 'node-fetch';
import { AbortSignal } from 'node-fetch/externals';
import { promises as fs, constants, createWriteStream, WriteStream, ReadStream } from 'fs';
import { basename, dirname, resolve, join, normalize, isAbsolute } from 'path';
import { sep as SEP_POSIX } from 'path/posix';
import { sep as SEP_WIN32 } from 'path/win32';

interface DlerInit extends RequestInit {
    filePath?: string;
    maxDuration?: number;
    checkOK?: boolean;
    attachmentFirst?: boolean;
    streamOptions?: Parameters<typeof createWriteStream>[1];
    onProgress?: (receivedLength?: number, totalLength?: number) => void;
    onReady?: (resp?: Response, saveAs?: string) => void | string;
}

const endsWithSep = (s: string) => s.endsWith(SEP_POSIX) || s.endsWith(SEP_WIN32);
const urlBasename = (u: string) => basename(new URL(u).pathname);

function resolveFilePath(filePath: string | undefined, url: string, headers: Headers, attachmentFirst: boolean): string {
    let rt: string;
    const attachment = readAttatchment(headers);

    if (attachment && attachmentFirst) {
        // attachment is set
        // if filePath is unset, just use attachment
        if (!filePath) rt = attachment;
        // if filePath is a directory, append attachment to it
        else rt = endsWithSep(filePath) ? join(filePath, attachment) : attachment;
    } else {
        // attachment is unset
        rt = filePath
            ? // endsWith SEP mean to download to a folder, otherwise just set the file path
              normalize(endsWithSep(filePath) ? join(filePath, urlBasename(url)) : filePath)
            : // if filePath is not set, get it from basename of the URL
              urlBasename(url);
    }

    // still cannot get file name
    if (!rt || endsWithSep(rt)) {
        const contentType = readContentType(headers);
        // check attatchment
        if (attachment) rt = join(rt, attachment);
        // if response is html document, use default name 'index.html'
        else if (contentType && contentType.startsWith('text/html')) rt = join(rt, 'index.html');
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

function readContentType(headers: Headers): string {
    const ct = headers.get('Content-Type');
    if (!ct) return '';
    return ct;
}

function readAttatchment(headers: Headers): string {
    const cd = headers.get('Content-Disposition');
    if (!cd) return '';
    const h = `attachment; filename="`;
    if (cd.startsWith(h) && cd.endsWith(`"`)) return cd.slice(h.length, -1);
    return '';
}

function pipe(rs: ReadStream, ws: WriteStream, totalLength: number, onProgress?: (receivedLength?: number, totalLength?: number) => void) {
    return new Promise<void>((resolve, reject) => {
        let receivedLength = 0;
        
        ws.on('error', reject);
        rs.on('data', chunk => {
            ws.write(chunk);
            if (typeof onProgress === 'function') {
                receivedLength += chunk.length;
                onProgress(receivedLength, totalLength);
            }
        });
        rs.on('error', reject);
        rs.on('end', () => {
            ws.end();
            resolve();
        });
    });
}

async function downloadFromFetch(fetcher: typeof fetch, input: RequestInfo, init?: DlerInit | string): Promise<string> {
    const options = typeof init === 'object' ? init : {};
    let filePath = typeof init === 'string' ? init : options.filePath;
    if (options.maxDuration && options.maxDuration > 0) {
        // ! OPTIONS - maxDuration
        if (options.signal) throw new Error('Cannot set both maxDuration and signal');
        const controller = new AbortController();
        options.signal = controller.signal as AbortSignal;
        options.maxDuration && setTimeout(() => controller.abort(), options.maxDuration);
    }

    const response = await fetcher(input, options);

    // ! OPTIONS - attachmentFirst
    filePath = resolveFilePath(filePath, response.url, response.headers, options.attachmentFirst || false);

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

    await makeSureDir(filePath); // make sure parent directory exists

    // ! OPTIONS - streamOptions
    const writeFile = createWriteStream(filePath, options.streamOptions);

    if (response.body !== null) {
        // ! OPTIONS - onProgress
        await pipe(response.body as ReadStream, writeFile, totalLength, options.onProgress);
    }

    return resolve(filePath);
}

function download(input: RequestInfo): Promise<string>;
function download(input: RequestInfo, filePath: string): Promise<string>;
function download(input: RequestInfo, init: DlerInit): Promise<string>;
function download(input: RequestInfo, init?: DlerInit | string): Promise<string> {
    return downloadFromFetch(fetch, input, init);
}

export { downloadFromFetch, download, type DlerInit };
export { downloadInCLI } from './cli';
