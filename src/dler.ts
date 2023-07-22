import fetch, { RequestInfo, RequestInit, Response, Headers } from 'node-fetch';
import { AbortSignal } from 'node-fetch/externals';
import { promises as fs, constants, createWriteStream, WriteStream, ReadStream } from 'fs';
import { basename, dirname, resolve, join, normalize, isAbsolute } from 'path';
import { sep as SEP_POSIX } from 'path/posix';
import { sep as SEP_WIN32 } from 'path/win32';

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
     * We use lowerCamelCase to avoid naming conflicts with `RequestInit`.
     * You cannot use this option with `signal` at the same time, as this option is just a wrapper of `signal`.
     */
    maxDuration?: number;
    /**
     * Do not check `response.ok` before writing to file.
     * If it is not set, an error will be thrown when the response is not ok.
     */
    uncheckOK?: boolean;
    /**
     * The options object for the `createWriteStream()` function, if needed.
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
    onReady?: (resp?: Response, saveAs?: string) => void | string;
    /**
     * This callback is only needed in the `downloadFromFetch` function when you use a custom `fetch` function.
     * In this case, the `body` may not be a `ReadStream` but a `ReadableStream` (you need to do a type cast in TypeScript).
     * With this option, simply passing Node.js's built-in `ReadStream.fromWeb()` function can make things work.
     */
    bodyConverter?: (body: ReadStream) => ReadStream;
}

const endsWithSep = (s: string) => s.endsWith(SEP_POSIX) || s.endsWith(SEP_WIN32);
const urlBasename = (u: string) => basename(new URL(u).pathname);

function resolveFilePath(filePath: string | undefined, url: string, headers: Headers): string {
    let rt: string;
    const attachment = readAttatchment(headers);

    rt = filePath
        ? // filePath is set
          normalize(
              endsWithSep(filePath)
                  ? // is a dir
                    join(filePath, attachment || urlBasename(url))
                  : // is a file
                    filePath,
          )
        : // filePath is not set
          attachment ||
          // if has `Content-Disposition: attachment; filename="xxx"`, use it
          // otherwise use url basename
          urlBasename(url);

    // still cannot get file name
    if (!rt || endsWithSep(rt)) {
        const contentType = readContentType(headers);
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

function readContentLength(headers: Headers): string {
    return headers.get('Content-Length') || '';
}

function readContentType(headers: Headers): string {
    return headers.get('Content-Type') || '';
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

/**
 * A replacement of `AbortSignal.timeout`
 */
function timeoutSignal(timeout: number): AbortSignal {
    const ac = new AbortController();
    setTimeout(ac.abort.bind(ac), timeout);
    return ac.signal as AbortSignal;
}

async function downloadFromFetch(fetcher: typeof fetch, input: RequestInfo, init?: DlerInit | string): Promise<string> {
    const options = typeof init === 'object' ? init : {};
    let filePath = typeof init === 'string' ? init : options.filePath;
    if (options.maxDuration && options.maxDuration > 0) {
        // ! OPTIONS - maxDuration
        if (options.signal) throw new Error('Cannot set both maxDuration and signal');
        options.signal = timeoutSignal(options.maxDuration);
    }

    const response = await fetcher(input, options);

    // ! OPTIONS - attachmentFirst
    filePath = resolveFilePath(filePath, response.url, response.headers);

    if (typeof options.onReady === 'function') {
        // ! OPTIONS - onReady
        const reset = options.onReady(response, filePath);
        if (typeof reset === 'string') {
            // ! OPTIONS - onReady - reset file path by given path
            if (reset.endsWith('/') || reset.endsWith('\\') || basename(reset).length === 0) throw new Error('Please set file name');
            filePath = reset;
        }
    }

    // ! OPTIONS - uncheckOK
    if (!options.uncheckOK) {
        if (!response.ok) throw new Error(`Unexpected response: ${response.status} ${response.statusText}`);
    }

    const contentLength = readContentLength(response.headers);
    const totalLength = contentLength ? Number.parseInt(contentLength, 10) : 0;

    await makeSureDir(filePath); // make sure parent directory exists

    // ! OPTIONS - streamOptions
    const writeFile = createWriteStream(filePath, options.streamOptions);

    if (response.body !== null) {
        // ! OPTIONS - bodyConvertor
        const body =
            typeof options.bodyConverter === 'function'
                ? options.bodyConverter(response.body as ReadStream)
                : (response.body as ReadStream);
        // ! OPTIONS - onProgress
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
export { downloadInCLI } from './cli';
