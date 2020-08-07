const download = require('../lib/index');
const { Headers } = require('node-fetch'); 
download('https://github.com/Crazy-White/dler/archive/master.zip', 'dler.zip')
    .then(()=>console.log('download from github successfully'))
    .catch(console.log)
    

download('https://i.pximg.net/img-original/img/2013/07/27/00/32/38/37339355_p0.jpg', null, {
    headers: new Headers({
        'Referer': 'https://www.pixiv.net/',
        'User-Agent': 'PixivIOSApp/6.7.1 (iOS 10.3.1; iPhone8,1)'
    })
})
    .then(()=>console.log('download from pixiv successfully'))
    .catch(console.log)
