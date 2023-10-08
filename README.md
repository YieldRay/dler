# dler

[![](https://badgen.net/packagephobia/install/dler)](https://packagephobia.com/result?p=dler)
[![](https://img.shields.io/npm/v/dler)](https://www.npmjs.com/package/dler)  
A simple download function with no dependency, based on built-in fetch.

> [!IMPORTANT]  
> `dler` is ESM only, and as it use the built-in `fetch`, it requires `nodejs>=17.5.0`

## Installation

```sh
$ npm install dler
```

## Usage

```js
import { download } from 'dler';
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
    filePath: 'dirname/',
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
    onReady?: (resp?: Response, saveAs?: string) => void | string;
}
```

use as a cli tool (will log a progress bar in console)

```js
import { downloadInCLI } from 'dler';
const progressBarWidth = 50; // default value
await downloadInCLI(url, [options[, progressBarWidth]]);
```

use as a global command

```sh
$ npm i dler -g
$ dler --help
```

use your own `fetch` function

```js
import { downloadFromFetch } from 'dler';

const myFetch: typeof fetch = async (input, init) => {
    const res = await fetch(input, init);
    console.log(res); // do something...
    return res;
};

const path = await downloadFromFetch(myFetch, 'https://example.net/test.html', {
    filePath: './',
);
```

## Example

see `./test`
