import react from '@vitejs/plugin-react-swc';
import { getReactMajorVersion, isUnsupportedVersion, versionsConfig, } from './version.js';
function getRenderer(reactConfig) {
    return {
        name: '@astrojs/react',
        clientEntrypoint: reactConfig.client,
        serverEntrypoint: reactConfig.server,
    };
}
function optionsPlugin(experimentalReactChildren) {
    const virtualModule = 'astro:react:opts';
    const virtualModuleId = '\0' + virtualModule;
    return {
        name: '@astrojs/react:opts',
        resolveId(id) {
            if (id === virtualModule) {
                return virtualModuleId;
            }
        },
        load(id) {
            if (id === virtualModuleId) {
                return {
                    code: `export default {
						experimentalReactChildren: ${JSON.stringify(experimentalReactChildren)}
					}`,
                };
            }
        },
    };
}
function getViteConfiguration({ experimentalReactChildren, devTarget, jsxImportSource, parserConfig, plugins, tsDecorators } = {}, reactConfig) {
    return {
        optimizeDeps: {
            include: [
                reactConfig.client,
                'react',
                'react/jsx-runtime',
                'react/jsx-dev-runtime',
                'react-dom',
            ],
            exclude: [reactConfig.server],
        },
        plugins: [react({ devTarget, jsxImportSource, parserConfig, plugins, tsDecorators }), optionsPlugin(!!experimentalReactChildren)],
        resolve: {
            dedupe: ['react', 'react-dom', 'react-dom/server'],
        },
        ssr: {
            external: reactConfig.externals,
            noExternal: [
                // These are all needed to get mui to work.
                '@mui/material',
                '@mui/base',
                '@babel/runtime',
                'use-immer',
                '@material-tailwind/react',
            ],
        },
    };
}
export default function ({ devTarget, jsxImportSource, parserConfig, plugins, tsDecorators, experimentalReactChildren, } = {}) {
    const majorVersion = getReactMajorVersion();
    if (isUnsupportedVersion(majorVersion)) {
        throw new Error(`Unsupported React version: ${majorVersion}.`);
    }
    const versionConfig = versionsConfig[majorVersion];
    return {
        name: '@astrojs/react',
        hooks: {
            'astro:config:setup': ({ command, addRenderer, updateConfig, injectScript }) => {
                addRenderer(getRenderer(versionConfig));
                updateConfig({
                    vite: getViteConfiguration({ devTarget, jsxImportSource, parserConfig, plugins, tsDecorators, experimentalReactChildren }, versionConfig),
                });
                if (command === 'dev') {
                }
            },
        },
    };
}
export function getContainerRenderer() {
    const majorVersion = getReactMajorVersion();
    if (isUnsupportedVersion(majorVersion)) {
        throw new Error(`Unsupported React version: ${majorVersion}.`);
    }
    const versionConfig = versionsConfig[majorVersion];
    return {
        name: '@astrojs/react',
        serverEntrypoint: versionConfig.server,
    };
}
