import download from '../lib/dler.js';
import downloadInCLI from '../cli.js';

await downloadInCLI('https://api.ip.sb/ip', '../tmp/ip.txt');

const filePath1 = await download('https://example.net', '../tmp/');
console.log(filePath1);

const filePath2 = await download('https://api.ip.sb/ip', '../tmp/ipaddress.txt');
console.log(filePath2);

const filePath3 = await download('https://api.ip.sb/ip', {
    filePath: '../tmp/oldPath.txt',
    onReady: (resp, saveAs) => {
        return '../tmp/newPath.txt';
    },
});
console.log(filePath3);

download('https://i.pximg.net/img-original/img/2013/07/27/00/32/38/37339355_p0.jpg'.replace('i.pximg.net', 'i.pixiv.re'), {
    headers: {
        Referer: 'https://www.pixiv.net/',
        'User-Agent': 'PixivIOSApp/6.7.1 (iOS 10.3.1; iPhone8,1)',
    },
    filePath: '../tmp/',
    onProgress: (receivedLength, totalLength) => {
        console.log(`${receivedLength} / ${totalLength}  (${(100 * (receivedLength / totalLength)).toFixed(2)}%)`);
    },
    onReady: (resp, saveAs) => console.log(`Downloading ${resp.url} to ${saveAs}`),
    maxDuration: 2000,
})
    .then(console.info)
    .catch(e => {
        console.error(e);
    });
