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
    // or filePath: 'dirname/' for saving as ./dirname/ip
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
    // if this is not provided or a folder name is provided, basename of the requested URL will be used
    abortTimeout?: number;
    // we use lowerCamelCase to avoid naming conflicts
    onProgress?: (receivedLength?: number, totalLength?: number) => void;
    // if no content-length is provided, totalLength get 0
    onReady?: (resp?: Response, saveAs?: string) => void | string;
    // callback when start to save file to the disk, if a string is given
    // file will saved as provided name, notice that this name will be the final path directly
}
```

## Example

see `./test`
