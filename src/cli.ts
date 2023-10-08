import { download, type DlerInit } from './dler.js';

// utils
const _print = process.stdout.write.bind(process.stdout);
const printToStartOfLine = (() => {
    let lastLineLength = 0;
    return (s: string) => {
        const str = String(s);
        const neededLength = Math.max(lastLineLength - str.length, 0);
        _print('\r' + str + ' '.repeat(neededLength) + '\b'.repeat(neededLength));
        lastLineLength = str.length;
    };
})();

// export a function that allow other program to use
async function downloadInCLI(url: string, options: DlerInit | string, printWidth = 50) {
    const opt = typeof options === 'object' ? options : {};
    const filePath = typeof options === 'string' ? options : options.filePath;

    const saved = await download(url, {
        ...opt,
        filePath,
        onProgress: (received?: number, total?: number) => {
            const percentage = received && total ? received / total : NaN;
            if (Number.isNaN(percentage) || total === 0 || percentage > 1) {
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
    _print('\n');
    return saved;
}

export { downloadInCLI };
