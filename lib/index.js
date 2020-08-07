const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const util = require('util');
const streamPipeline = util.promisify(require('stream').pipeline);

async function download(url, filePath, options) {
    filePath = filePath || path.basename(url);
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
        return streamPipeline(response.body, fs.createWriteStream(filePath))
    } else {
        throw new Error(`unexpected response ${response.statusText}`);
    }
}

module.exports = download