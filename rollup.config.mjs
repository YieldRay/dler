import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/dler.ts',
    output: {
        dir: 'lib',
        format: 'cjs',
    },
    plugins: [typescript()],
};
