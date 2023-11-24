import { sveltekit } from '@sveltejs/kit/vite';

const config = {
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:8080',
			},
		},
	},
	plugins: [sveltekit()],
};

export default config;
