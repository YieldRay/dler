# dler

[![](https://badgen.net/packagephobia/install/dler)](https://packagephobia.com/result?p=dler)
[![](https://img.shields.io/npm/v/dler)](https://www.npmjs.com/package/dler)  
A simple download function, which needs only one dependency (`node-fetch`) , and is based on Promise.

## Installation

```sh
$ npm install dler
```

## Usage

```js
import download from 'dler';
const url = 'https://api.ip.sb/ip';
const filePath = './ipinfo.txt'; // optional string, if not set, use basename of url
const options = {
    /*......*/
}; // optional object, same as the init in fetch(url: RequestInfo, init?: RequestInit | undefined): Promise<Response>
```

see more in [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)

```js
download(url [,options [,filePath]])
.then(path=>{
    // path: absolute file path
    // do something...
})

// if path is not given, will be set automatically
download(url)
download(url, options)
download(url, options, filePath)
```

## Example

see `./test`
