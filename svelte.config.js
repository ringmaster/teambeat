import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess()],
	onwarn: (warning, handler) => {
		if (warning.code.startsWith('a11y-')) {
			return;
		}
		handler(warning);
	},
	kit: {
		adapter: adapter({
			// default options are shown. On some platforms
			// these options are set automatically — see below
			pages: 'build',
			assets: 'build',
			fallback: "index.html",
			precompress: false,
			strict: false,
			trailingSlash: 'always'
		}),
		prerender: {entries: ['*', '/board/[boardid]', '/share/[boardid]']},
		paths: {
			base: "",
		},
		alias: {
			$utils: path.resolve('./src/utils'),
			$stores: path.resolve('./src/stores'),
		}
	}
};

export default config;
