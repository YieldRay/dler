import fetch from 'node-fetch';
import { promises as fs, constants, createWriteStream, ReadStream } from 'fs';
import { basename, dirname, resolve } from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';
const streamPipeline = promisify(pipeline);
async function download(url: RequestInfo): Promise<string>;
async function download(url: RequestInfo, options: RequestInit): Promise<string>;
async function download(url: RequestInfo, filePath: string): Promise<string>;
async function download(url: RequestInfo, options: RequestInit, filePath: string): Promise<string>;
async function download(url: RequestInfo, options?: RequestInit | string, filePath?: string): Promise<string> {
    if (typeof options === 'string') {
        // (url, options=filePath)
        filePath = options;
        options = {};
    } else {
        // (url, options=options, filePath?)
        if (filePath?.endsWith('/')) {
            filePath += basename(new URL(typeof url === 'string' ? url : url.url).pathname);
        } else filePath = basename(new URL(typeof url === 'string' ? url : url.url).pathname);
    }

    if (typeof filePath === 'string') {
        // (url, options, filePath)
        if (filePath.endsWith('/')) {
            filePath += basename(new URL(typeof url === 'string' ? url : url.url).pathname);
        }
    }

    const dirName = dirname(filePath);
    try {
        await fs.access(dirName, constants.R_OK | constants.W_OK);
    } catch (_) {
        await fs.mkdir(dirName, { recursive: true });
    }

    const response = await fetch(url, options);

    if (response.ok) {
        await streamPipeline(response.body as unknown as ReadStream, createWriteStream(filePath));
        return resolve(filePath);
    } else {
        throw new Error(`unexpected response ${response.statusText}`);
    }
}

export default download;
