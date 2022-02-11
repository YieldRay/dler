import download from '../lib/dler.js';

download('https://api.ip.sb/ip', {}, '../tmp/')
    .then(path => console.log('File save to: ' + path))
    .catch(console.log);

download(
    'https://i.pximg.net/img-original/img/2013/07/27/00/32/38/37339355_p0.jpg',
    {
        headers: {
            Referer: 'https://www.pixiv.net/',
            'User-Agent': 'PixivIOSApp/6.7.1 (iOS 10.3.1; iPhone8,1)',
        },
    },
    '../tmp/',
)
    .then(path => console.log('File save to: ' + path))
    .catch(console.log);
