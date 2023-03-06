import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

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
			fallback: "200.html",
			precompress: false,
			strict: false,
			trailingSlash: 'always'
		}),
		prerender: {entries: ['*', '/board/[boardid]', '/share/[boardid]']},
		paths: {
			base: "",
		}
	}
};

export default config;
