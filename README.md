# dler

[![](https://badgen.net/packagephobia/install/dler)](https://packagephobia.com/result?p=dler)
[![](https://img.shields.io/npm/v/dler)](https://www.npmjs.com/package/dler)  
Smart and easy-to-use `fetch`-based downloader for Node.js compatible runtimes.

> [!IMPORTANT]  
> `dler` is ESM only, and since it uses the built-in `fetch`, it requires `nodejs>=17.5.0`.

## Features

-   Automatically detect the download file name.
-   Supports resuming downloads.
-   Bing your own `fetch`.

## Limitations

-   Does not support multi-threaded or segmented downloads; only sequential downloads are supported.
-   Proxy support depends on the runtime's implementation of the `fetch` function. For example, Deno supports [automatic proxy](https://docs.deno.com/runtime/manual/basics/modules/proxies), while Node.js and Bun do not.  
    However, this can be addressed by customizing the `fetch` function.

## Installation

```sh
$ npm install dler
```

## Usage

```js
import { download } from 'dler';

const url = 'https://api.ip.sb/ip';

// simple
download(url, './ipinfo.txt');

// auto detect file name
download(url);
download(url, 'dirname/');

// with options
download(url, {
    filePath: 'dirname/',
    onProgress: (receivedLength, totalLength) => {
        if (totalLength) console.log((100 * (receivedLength / totalLength)).toFixed(2) + '%');
    },
    onReady: (resp, saveAs) => console.log(`Downloading ${resp.url} to ${saveAs}`),
    /* other options in RequestInit */
    headers: {
        Authorization: 'Bearer xxx',
    },
    signal: AbortSignal.timeout(1000),
});
```

```js
// use promise
download(url [,options]).then(path => console.log(`File saved to ${path}`));

// use async/await
const absolutePath = await download(url [,options]);
```

```ts
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
```

Use as a CLI tool (will log a progress bar in console).

```js
import { downloadInCLI } from 'dler';
const progressBarWidth = 50; // default value
await downloadInCLI(url, [options[, progressBarWidth]]);
```

Use as a global command.

```sh
$ npm i dler -g
$ dler --help
```

Use your own `fetch` function.

```js
import { downloadFromFetch } from 'dler';

const myFetch: typeof fetch = async (input, init) => {
    const res = await fetch(input, init);
    console.log(res); // do something...
    return res;
};

const path = await downloadFromFetch(myFetch, 'https://example.net/test.html', {
    filePath: './',
});
```

## Example

See `./test`
