const download = require('../lib/index');
const { Headers } = require('node-fetch'); 
download('https://github.com/Crazy-White/dler/archive/master.zip', 'zip/')
    .then(path=>console.log('download from github successfully. At ' + path))
    .catch(console.log)
    

download('https://i.pximg.net/img-original/img/2013/07/27/00/32/38/37339355_p0.jpg', {
    headers: new Headers({
        'Referer': 'https://www.pixiv.net/',
        'User-Agent': 'PixivIOSApp/6.7.1 (iOS 10.3.1; iPhone8,1)'
    })
})
    .then(path=>console.log('download from pixiv successfully. At ' + path))
    .catch(console.log)

