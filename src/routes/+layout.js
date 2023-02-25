// This can be false if you're using a fallback (i.e. SPA mode)
export const prerender = true;
export const ssr = false;

import { registerIconLibrary } from '@shoelace-style/shoelace/dist/utilities/icon-library.js';
    
registerIconLibrary('fa', {
    resolver: name => {
        const filename = name.replace(/^fa[rbs]-/, '');
        let folder = 'regular';
        if (name.substring(0, 4) === 'fas-') folder = 'solid';
        if (name.substring(0, 4) === 'fab-') folder = 'brands';
        return `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.1/svgs/${folder}/${filename}.svg`;
    },
    mutator: svg => svg.setAttribute('fill', 'currentColor')
});