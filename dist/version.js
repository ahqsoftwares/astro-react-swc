import { version as ReactVersion } from 'react-dom';
export function getReactMajorVersion() {
    const matches = /\d+\./.exec(ReactVersion);
    if (!matches) {
        return NaN;
    }
    return Number(matches[0]);
}
export function isUnsupportedVersion(majorVersion) {
    return majorVersion < 17 || majorVersion > 19 || Number.isNaN(majorVersion);
}
export const versionsConfig = {
    17: {
        server: 'astro-react-swc/server-v17.js',
        client: 'astro-react-swc/client-v17.js',
        externals: ['react-dom/server.js', 'react-dom/client.js'],
    },
    18: {
        server: 'astro-react-swc/server.js',
        client: 'astro-react-swc/client.js',
        externals: ['react-dom/server', 'react-dom/client'],
    },
    19: {
        server: 'astro-react-swc/server.js',
        client: 'astro-react-swc/client.js',
        externals: ['react-dom/server', 'react-dom/client'],
    },
};
