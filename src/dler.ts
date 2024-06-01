import { promises as fs, constants, createWriteStream, ReadStream, PathLike } from 'fs';
import { basename, dirname, resolve, join, normalize, isAbsolute } from 'path';
import { sep as SEP_POSIX } from 'path/posix';
import { sep as SEP_WIN32 } from 'path/win32';
import { ReadableStream } from 'stream/web';
import type { Readable, Writable } from 'stream';

/**
 * Interface representing the initialization options for the downloader.
 * Extends the `RequestInit` interface.
 *
 * Boolean options default to `false` if not specified.
 */
interface DlerInit extends RequestInit {
    /**
     * Optional file path where the downloaded file will be saved.
     * If not provided or if provided as a string ending with '/', the file name will be derived from
     * the `Content-Disposition` header or the basename of the requested URL.
     */
    filePath?: string;

    /**
     * Flag to bypass the default check for HTTP status.
     * By default, the response is considered OK if `response.ok` is true.
     * Set this to `true` to disable this check.
     */
    doNotCheckOK?: boolean;

    /**
     * Flag to enable resuming the download if the file already exists.
     * By default, resumption is not attempted.
     * Set this to `true` to enable download resumption.
     * By default, resumption commences at the file size, which may not be desirable.
     * Specify a number to reset the starting range.
     */
    tryResumption?: boolean | number;

    /**
     * Callback function for monitoring download progress.
     * If `Content-Length` is not provided, `totalLength` will be set to `0`.
     *
     * @param receivedLength - The number of bytes received so far.
     * @param totalLength - The total number of bytes to be received.
     */
    onProgress?: (receivedLength?: number, totalLength?: number) => void;

    /**
     * Callback function invoked when the file is ready to be saved to disk.
     * If a string is returned, the file will be saved to the specified path.
     * This path overrides the `filePath` option.
     *
     * @param resp - The response object from the fetch request.
     * @param saveAs - Suggested file path for saving the file.
     * @returns A string representing the file path where the file should be saved, or a void/Promise resolving to such a string or void.
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
        else throw new Error(`Unable to determine file name, filePath: '${filePath}' is a directory and url: '${url}' ends with '/'`);
    }
    return normalize(isAbsolute(rt) ? rt : join(resolve(), rt));
}

async function makeSureParentDirExists(filePath: string) {
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

function pipe(
    rs: Readable,
    ws: Writable,
    startLength: number = 0,
    totalLength: number,
    onProgress?: (receivedLength?: number, totalLength?: number) => void,
) {
    return new Promise<void>((resolve, reject) => {
        let receivedLength = startLength;

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

async function getRegularFileSize(path: PathLike) {
    try {
        const s = await fs.stat(path);
        if (s.isFile()) {
            return s.size;
        } else {
            return 0;
        }
    } catch {
        return 0;
    }
}

async function downloadFromFetch(fetchFunction: typeof fetch, input: RequestInfo, init?: DlerInit | string): Promise<string> {
    const options = typeof init === 'object' ? init : {};
    let filePath = typeof init === 'string' ? init : options.filePath;

    const request = new Request(input, options);

    // ! OPTIONS - tryResumption
    if (options.tryResumption) {
        // evidently utilizing the response headers is not feasible for now
        filePath = resolveFilePath(filePath, request.url);
    }

    // ! OPTIONS - tryResumption
    let start: number = options.tryResumption
        ? (typeof options.tryResumption === 'number' ? options.tryResumption : 0) ||
          // by file size
          (await getRegularFileSize(filePath!))
        : 0;
    if (options.tryResumption && start > 0) {
        request.headers.set('Range', `bytes=${start}-`);
    }

    const response = await fetchFunction(request);
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

    // parent dir may not exist when start is 0
    if (start === 0) await makeSureParentDirExists(filePath);

    const writeFile = createWriteStream(filePath, {
        /** https://nodejs.org/api/fs.html#file-system-flags */
        flags: start > 0 && response.status === 206 ? 'a' : 'w',
    });

    if (response.body !== null) {
        let body: Readable;
        if (response.body instanceof ReadableStream) body = ReadStream.fromWeb(response.body);
        else body = response.body as any as Readable;
        await pipe(body, writeFile, start, totalLength, options.onProgress);
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
