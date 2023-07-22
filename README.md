# dler

[![](https://badgen.net/packagephobia/install/dler)](https://packagephobia.com/result?p=dler)
[![](https://img.shields.io/npm/v/dler)](https://www.npmjs.com/package/dler)  
A simple download function, which only requires `node-fetch@2` preinstalled, and is based on Promise.

## Installation

```sh
$ npm install dler
```

## Usage

```js
import { download } from 'dler';
// or
const { download } = require('dler');
```

```js
const url = 'https://api.ip.sb/ip';

// simple
download(url, './ipinfo.txt');

// auto detect file name
download(url);
download(url, 'dirname/');

// with options
download(url, {
    filePath,
    onProgress: (receivedLength, totalLength) => {
        if (totalLength) console.log((100 * (receivedLength / totalLength)).toFixed(2) + '%');
    },
    onReady: (resp, saveAs) => console.log(`Downloading ${resp.url} to ${saveAs}`),
    /* other options in RequestInit */
});
```

```js
// use promise
download(url [,options]).then(path => console.log(`File saved to ${path}`));

// use async/await
const absolutePath = await download(url [,options]);
```

As nodejs's built-in `fetch` is only available in version >= 17 and the LTS version (node18) is not widely used,  
the lightweight replacement `node-fetch@2` is required to cover most the node versions,  
as a result, the (`fetch` related) types listed below is not built-in type but from `node-fetch@2`  
(only need to be carefully handled in typescript, and you can customize the fetch function, see below)

```ts
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
```

use as a cli tool (will log a progress bar in console)

```js
import { downloadInClI } from 'dler';
const progressBarWidth = 50; // default value
await downloadInClI(url, [options[, progressBarWidth]]);
```

use as a global command

```sh
$ npm i dler -g
$ dler --help
```

use your own `fetch` function

```js
import { downloadFromFetch } from 'dler';
import { ReadStream } from 'node:fs';
const path = await downloadFromFetch(fetch, 'https://example.net/test.html', {
    bodyConvertor: ReadStream.fromWeb,
    filePath: './',
});
```

however you have to cast them to any in typescript (it works fine, don't worry)

```ts
downloadFromFetch(globalThis.fetch as any, 'https://example.net/test.html', {
    bodyConvertor: ReadStream.fromWeb as any,
    filePath: './',
});
```

## Example

see `./test`
