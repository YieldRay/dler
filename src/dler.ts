import { promises as fs, constants, createWriteStream, WriteStream, ReadStream } from 'fs';
import { basename, dirname, resolve, join, normalize, isAbsolute } from 'path';
import { sep as SEP_POSIX } from 'path/posix';
import { sep as SEP_WIN32 } from 'path/win32';
import { ReadableStream } from 'stream/web';
import type { Readable, Writable } from 'stream';

/**
 * options should fit `DlerInit`.
 * default boolean type options, will be `false` if unset.
 */
interface DlerInit extends RequestInit {
    /**
     * If not provided or provided as a string with a suffix '/', the file name will be obtained from
     * the `Content-Disposition` header or the basename of the requested URL.
     */
    filePath?: string;
    /**
     * By default, we check if http status is ok by checking if response.ok is true
     */
    doNotCheckOK?: boolean;
    /**
     * Options object for the `createWriteStream()` function to create file, if needed.
     */
    streamOptions?: Parameters<typeof createWriteStream>[1];
    /**
     * If `Content-Length` is not provided, `totalLength` will be set to `0`.
     */
    onProgress?: (receivedLength?: number, totalLength?: number) => void;
    /**
     * Callback when starting to save the file to the disk.
     * If a string is returned, the file will be downloaded to that path.
     * This will override the `filePath` option.
     */
    onReady?: (resp: Response, saveAs: string) => string | void | Promise<string | void>;
}

const endsWithSep = (s: string) => s.endsWith(SEP_POSIX) || s.endsWith(SEP_WIN32);
const urlBasename = (u: string) => basename(new URL(u).pathname);

function resolveFilePath(filePath: string | undefined, url: string, headers?: Headers): string {
    const guessFileNameFromRequest = () => guessFileNameFromHeaders(headers) || urlBasename(url);

    let rt = filePath
        ? // filePath is set
          normalize(
              endsWithSep(filePath)
                  ? // is a dir
                    join(filePath, guessFileNameFromRequest())
                  : // is a file
                    filePath,
          )
        : // filePath is not set
          guessFileNameFromRequest();

    // still cannot get file name
    if (!rt || endsWithSep(rt)) {
        const contentType = headers?.get('Content-Type') || '';
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

function guessFileNameFromHeaders(headers?: Headers): string {
    if (!headers) return '';
    const cd = headers.get('Content-Disposition');
    if (!cd) return '';
    const h = `attachment; filename="`; // remove these string
    if (cd.startsWith(h) && cd.endsWith(`"`)) return basename(cd.slice(h.length, -1));
    return '';
}

function pipe(rs: Readable, ws: Writable, totalLength: number, onProgress?: (receivedLength?: number, totalLength?: number) => void) {
    return new Promise<void>((resolve, reject) => {
        let receivedLength = 0;

        ws.on('error', reject);
        rs.on('error', reject);
        rs.on('data', chunk => {
            ws.write(chunk);
            if (typeof onProgress === 'function') {
                receivedLength += chunk.length;
                onProgress(receivedLength, totalLength);
            }
        });
        rs.on('end', () => {
            ws.end();
            resolve();
        });
    });
}

async function downloadFromFetch(fetchFunction: typeof fetch, input: RequestInfo, init?: DlerInit | string): Promise<string> {
    const options = typeof init === 'object' ? init : {};
    let filePath = typeof init === 'string' ? init : options.filePath;

    const response = await fetchFunction(input, options);

    // ! OPTIONS - attachmentFirst
    filePath = resolveFilePath(filePath, response.url, response.headers);

    if (typeof options.onReady === 'function') {
        // ! OPTIONS - onReady
        const reset = await options.onReady(response, filePath);
        if (typeof reset === 'string') {
            // ! OPTIONS - onReady - reset file path by given path
            if (reset.endsWith('/') || reset.endsWith('\\') || basename(reset).length === 0) throw new Error('Please set file name');
            filePath = reset;
        }
    }

    // ! OPTIONS - doNotCheckOK
    if (!options.doNotCheckOK) {
        if (!response.ok) throw new Error(`Unexpected response: ${response.status} ${response.statusText}`);
    }

    const contentLength = response.headers.get('Content-Length') || '';
    const totalLength = contentLength ? Number.parseInt(contentLength, 10) : 0;

    await makeSureDir(filePath); // make sure parent directory exists

    // ! OPTIONS - streamOptions
    const writeFile = createWriteStream(filePath, options.streamOptions);

    if (response.body !== null) {
        let body: Readable;
        if (response.body instanceof ReadableStream) body = ReadStream.fromWeb(response.body);
        else body = response.body as any as Readable;
        await pipe(body, writeFile, totalLength, options.onProgress);
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
export { downloadInCLI } from './cli.js';
