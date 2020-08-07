const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const util = require('util');
const streamPipeline = util.promisify(require('stream').pipeline);

async function download(...args) {
    let [url, filePath, options] = args;
    if (typeof args[1] === 'string' && args[1].endsWith('/')) {
        filePath = args[1] + path.basename(new URL(url).pathname);
    }
    if (args.length === 2 && typeof args[1] === 'object') {
        options = args[1];
        filePath = path.basename(new URL(url).pathname);
    }
    if (args.length === 1) filePath = path.basename(new URL(url).pathname);
    const dirName = path.dirname(filePath);
    try {
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName);
        }
    } catch (err) {
        throw new Error(err);
    }
    const response = await fetch(url, options);
    if (response.ok) {
        await streamPipeline(response.body, fs.createWriteStream(filePath))
        return path.resolve(filePath);
    } else {
        throw new Error(`unexpected response ${response.statusText}`);
    }
}

module.exports = download