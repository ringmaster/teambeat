// This can be false if you're using a fallback (i.e. SPA mode)
export const prerender = true;
export const ssr = false;

import { env } from '$env/dynamic/public';

import PocketBase from 'pocketbase';

export async function load() {
    let cookie = document.cookie
    console.log("COOKIE DATA", cookie)

    let pb = new PocketBase(env.PUBLIC_POCKETBASE_URL)

    pb.authStore.loadFromCookie(cookie || '');

	try {
		pb.authStore.isValid && (await pb.collection('users').authRefresh());
	} catch (_) {
		pb.authStore.clear();
	}

    document.cookie = pb.authStore.exportToCookie({ httpOnly: false })
	
    console.log("COOKIE SET", pb.authStore.exportToCookie({ httpOnly: false }))

    return {
        pb: pb
    };
}