const download = require('./lib/dler.js');
const path = require('path');

// utils
const print = process.stdout.write.bind(process.stdout);
const printToStartOfLine = (() => {
    let lastLineLength = 0;
    return s => {
        const str = String(s);
        const neededLength = Math.max(lastLineLength - str.length, 0);
        print('\r' + str + ' '.repeat(neededLength) + '\b'.repeat(neededLength));
        lastLineLength = str.length;
    };
})();

// export a function that allow other program to use
function downloadInCLI(url, saveAs = './', printWidth = 50) {
    const filePath = path.isAbsolute(saveAs) ? saveAs : path.normalize(path.resolve() + '/' + saveAs);
    return download(url, {
        filePath,
        onProgress: (received, total) => {
            const percentage = received / total;
            if (total === 0 || percentage > 1) {
                printToStartOfLine(`[received ${received} bytes] unknown%`);
            } else {
                const text = `${received}/${total} = ${Math.floor(percentage * 100)}%`;
                const textWidth = text.length;
                const barWidth = printWidth - textWidth;
                const blocks = Math.round(percentage * barWidth);
                const spaces = barWidth - blocks;
                const bar = barWidth > 5 ? '[' + ('█'.repeat(blocks) + ' '.repeat(spaces)) + ']' : '';
                printToStartOfLine(bar + text);
            }
        },
    });
}
module.exports = downloadInCLI;
