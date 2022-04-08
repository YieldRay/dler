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

const url = 'https://api.ip.sb/ip';
const options = {
    filePath: './ipinfo.txt',
    onProgress: (receivedLength, totalLength) => {
        console.log((100 * (receivedLength / totalLength)).toFixed(2) + '%');
    },
    /*......*/
};


download(url[, options]).then(path => {
    console.log(`file saved to ${path}`);
});


// or use async/await
const path = await download(url [,options]);

// options should fit DlerInit
interface DlerInit extends RequestInit {
    filePath?: string;
    userTimeout?: number;
    // we use lowerCamelCase to avoid naming conflicts
    onProgress?: (receivedLength?: number, totalLength?: number) => void;
    // if no content-length is provided, totalLength get 0
}

```

## Example

see `./test`
