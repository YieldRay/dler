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
const absolutePath = await download(url [,options]);

// options should fit DlerInit
interface DlerInit extends RequestInit {
    filePath?: string;
    // if this is not provided or a folder name is provided, basename of the requested URL will be used
    // the file will be downloaded to the same working directory related to the calling script
    maxDuration?: number;
    // we use lowerCamelCase to avoid naming conflicts
    // using this option, then you cannot set option `signal` as this option is just a wrapper of `signal`
    onProgress?: (receivedLength?: number, totalLength?: number) => void;
    // if no content-length is provided, totalLength get 0
    onReady?: (resp?: Response, saveAs?: string) => void | string;
    // callback when start to save file to the disk, if a string is given
    // file will saved as provided name, notice that this name will be the final path directly
}
```

use as a cli tool (will log a progress bar in console)

```js
import downloadInCli from 'dler/cli.js';
const progressBarWidth = 50; // default value
await downloadInCli(url, [pathOrFolder[, progressBarWidth]]);
```

use as a global command

```sh
$ npm i dler -g
$ dler --help
```

## Example

see `./test`
