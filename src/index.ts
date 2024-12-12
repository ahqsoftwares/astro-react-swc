import react from '@vitejs/plugin-react-swc';
import type { ParserConfig, JscTarget } from "@swc/core";

type ViteReactPluginOptions = {
	/**
	 * Control where the JSX factory is imported from.
	 * @default "react"
	 */
	jsxImportSource?: string;
	/**
	 * Enable TypeScript decorators. Requires experimentalDecorators in tsconfig.
	 * @default false
	 */
	tsDecorators?: boolean;
	/**
	 * Use SWC plugins. Enable SWC at build time.
	 * @default undefined
	 */
	plugins?: [string, Record<string, any>][];
	/**
	 * Set the target for SWC in dev. This can avoid to down-transpile private class method for example.
	 * For production target, see https://vitejs.dev/config/build-options.html#build-target
	 * @default "es2020"
	 */
	devTarget?: JscTarget;
	/**
	 * Override the default include list (.ts, .tsx, .mts, .jsx, .mdx).
	 * This requires to redefine the config for any file you want to be included.
	 * If you want to trigger fast refresh on compiled JS, use `jsx: true`.
	 * Exclusion of node_modules should be handled by the function if needed.
	 */
	parserConfig?: (id: string) => ParserConfig | undefined;
};

import type { AstroIntegration, ContainerRenderer } from 'astro';
import type * as vite from 'vite';
import {
	type ReactVersionConfig,
	type SupportedReactVersion,
	getReactMajorVersion,
	isUnsupportedVersion,
	versionsConfig,
} from './version.js';

export type ReactIntegrationOptions = ViteReactPluginOptions & {
	experimentalReactChildren?: boolean;
};

function getRenderer(reactConfig: ReactVersionConfig) {
	return {
		name: '@astrojs/react',
		clientEntrypoint: reactConfig.client,
		serverEntrypoint: reactConfig.server,
	};
}

function optionsPlugin(experimentalReactChildren: boolean): vite.Plugin {
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

function getViteConfiguration(
	{ experimentalReactChildren, devTarget, jsxImportSource, parserConfig, plugins, tsDecorators }: ReactIntegrationOptions = {},
	reactConfig: ReactVersionConfig,
) {
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

export default function ({
	devTarget, jsxImportSource, parserConfig, plugins, tsDecorators,
	experimentalReactChildren,
}: ReactIntegrationOptions = {}): AstroIntegration {
	const majorVersion = getReactMajorVersion();
	if (isUnsupportedVersion(majorVersion)) {
		throw new Error(`Unsupported React version: ${majorVersion}.`);
	}
	const versionConfig = versionsConfig[majorVersion as SupportedReactVersion];

	return {
		name: '@astrojs/react',
		hooks: {
			'astro:config:setup': ({ command, addRenderer, updateConfig, injectScript }) => {
				addRenderer(getRenderer(versionConfig));
				updateConfig({
					vite: getViteConfiguration(
						{ devTarget, jsxImportSource, parserConfig, plugins, tsDecorators, experimentalReactChildren },
						versionConfig,
					),
				});
				if (command === 'dev') {
				}
			},
		},
	};
}

export function getContainerRenderer(): ContainerRenderer {
	const majorVersion = getReactMajorVersion();
	if (isUnsupportedVersion(majorVersion)) {
		throw new Error(`Unsupported React version: ${majorVersion}.`);
	}
	const versionConfig = versionsConfig[majorVersion as SupportedReactVersion];

	return {
		name: '@astrojs/react',
		serverEntrypoint: versionConfig.server,
	};
}
