# dler

[![](https://badgen.net/packagephobia/install/dler)](https://packagephobia.com/result?p=dler)
[![](https://img.shields.io/npm/v/dler)](https://www.npmjs.com/package/dler)  
A simple download function, which needs only one dependency (`node-fetch@2`) , and is based on Promise.

## Installation

```sh
$ npm install dler
```

## Usage

```js
import download from 'dler';
// or
const download = require("dler");

const url = 'https://api.ip.sb/ip';
const options = {
    filePath: './ipinfo.txt',
    onProgress: (receivedLength, totalLength) => {
        console.log((100 * (receivedLength / totalLength)).toFixed(2) + '%');
    },
    onReady: (resp, saveAs) => console.log(`Downloading ${resp.url} to ${saveAs}`),
    /* other options in RequestInit */
};


download(url[, options]).then(path => {
    console.log(`File saved to ${path}`);
});


// or use async/await
const path = await download(url [,options]);

// options should fit DlerInit
interface DlerInit extends RequestInit {
    filePath?: string;
    abortTimeout?: number;
    // we use lowerCamelCase to avoid naming conflicts
    onProgress?: (receivedLength?: number, totalLength?: number) => void;
    // if no content-length is provided, totalLength get 0
    onReady?: (resp?: Response, saveAs?: string) => void;
    // start to save file to the disk
}
```

## Example

see `./test`
