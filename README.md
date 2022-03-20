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
    /*......*/
}; // optional object, same as the init in fetch(url: RequestInfo, init?: RequestInit | undefined): Promise<Response>
const filePath = './ipinfo.txt'; // optional string, if not set, use basename of url
download(url [,options [,filePath]])
.then(path=>{
    console.log(`file saved to ${path}`);
})
```

## Example

see `./test`
