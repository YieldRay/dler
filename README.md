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
const download = require('dler');
const url = 'https://api.ip.sb/ip';
const filePath = './ipinfo.txt'; // optional string, if not set, use basename of url
const options = {
    /*......*/
}; // optional object, same as the options in fetch(url, options)
```

see more in [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)

```js
download(url[, filePath, options])
.then(path=>{
    // path: absolute file path
    // do something...
})

// if path is not given, set automatically
download(url, options)
download(url, path)
download(url)
```

## Example

```js
// normally...
const download = require('dler');
download('https://api.ip.sb/ip', 'ipinfo.txt')
    .then(() => console.log('done'))
    .catch(console.log);

// download an image from pixiv
const download = require('dler');
const { Headers } = require('node-fetch');
download('https://i.pximg.net/img-original/img/2013/07/27/00/32/38/37339355_p0.jpg', {
    headers: new Headers({
        Referer: 'https://www.pixiv.net/',
        'User-Agent': 'PixivIOSApp/6.7.1 (iOS 10.3.1; iPhone8,1)',
    }),
})
    .then(path => console.log(`downloaded at ${path}`))
    .catch(console.log);
```
