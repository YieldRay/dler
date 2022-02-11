import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';
const streamPipeline = promisify(pipeline);
async function download(url: RequestInfo): Promise<string>;
async function download(url: RequestInfo, options?: RequestInit): Promise<string>;
async function download(url: RequestInfo, options: RequestInit, filePath: string): Promise<string>;
async function download(url: RequestInfo, options?: RequestInit, filePath?: string): Promise<string> {
    if (typeof filePath === 'string') {
        if (filePath.endsWith('/')) {
            filePath += path.basename(new URL(typeof url === 'string' ? url : url.url).pathname);
        }
    } else {
        filePath = path.basename(new URL(url as string).pathname);
    }
    const dirName = path.dirname(filePath);
    try {
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName);
        }
    } catch (err) {
        throw err;
    }
    const response = await (fetch as (url: RequestInfo, init?: RequestInit) => Promise<Response>)(url, options);

    if (response.ok) {
        // use 'any': Type 'ReadableStream<Uint8Array>' does not satisfy the constraint 'PipelineSource<any>'
        await streamPipeline<any, fs.WriteStream>(response.body, fs.createWriteStream(filePath));
        return path.resolve(filePath);
    } else {
        throw new Error(`unexpected response ${response.statusText}`);
    }
}

export default download;
