<script>
    import { pbStore } from 'svelte-pocketbase';
    import { env } from '$env/dynamic/public';
    import { goto } from '$app/navigation';
    import '@milkdown/theme-nord/style.css';
    import '../app.scss';
    
    pbStore.set(env.PUBLIC_POCKETBASE_URL);
    $pbStore.autoCancellation(false);
    
    if(!$pbStore.authStore.isValid) {
        if (["/", "/login"].indexOf(location.href) === false) {
            goto("/");
        }
    }
    
    $: loggedIn = $pbStore.authStore.isValid
    $: user = $pbStore.authStore.model
    
    function doLogout() {
        $pbStore.authStore.clear()
        document.cookie = $pbStore.authStore.exportToCookie({ httpOnly: false, expires: 0 })
        goto("/");
    }
    
</script>

<svelte:head>
<script src="https://kit.fontawesome.com/7e2abaa70e.js" crossorigin="anonymous" data-observe-mutations></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0/dist/themes/light.css" />
<script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0/dist/shoelace.js"></script>
</svelte:head>

<nav class="navbar has-shadow" aria-label="main navigation">
    <div class="container">
        <div class="navbar-brand">
            <a href="/" class="navbar-item">
                <i class="fa-sharp fa-solid fa-wave-pulse"></i>
                <h1 class="title">Teambeat</h1>
            </a>
        </div>
        
        <div class="navbar-menu">
            <div class="navbar-start">
                <a class="navbar-item" href="/">Boards</a>
                <a class="navbar-item" href="#docs">Documentation</a>
            </div>
            
            <div class="navbar-end">
                <div class="navbar-item">
                    {#if loggedIn}
                    <div class="navbar-item has-dropdown is-hoverable is-right">
                        <a class="navbar-link" href="#more">
                            <span class="icon-text">
                                <span class="icon">
                                    <i class="fa-solid fa-user"></i>
                                </span>
                                <span>{user.name}</span>
                            </span>
                        </a>
                        
                        <div class="navbar-dropdown">
                            <a href="/account" class="navbar-item">
                                <span class="icon-text">
                                    <span class="icon">
                                        <i class="fa-light fa-file-user"></i>
                                    </span>
                                    <span>Account</span>
                                </span>
                            </a>
                            <hr class="navbar-divider">
                            <a href="/logout" class="navbar-item">
                                <span class="icon-text">
                                    <span class="icon">
                                        <i class="fa-solid fa-right-from-bracket"></i>
                                    </span>
                                    <span>Log Out</span>
                                </span>
                            </a>
                        </div>
                    </div>
                    {:else}
                    <a href="/login" class="navbar-item">
                        <span class="icon-text">
                            <span class="icon">
                                <i class="fa-light fa-right-to-bracket"></i>
                            </span>
                            <span>Log In</span>
                        </span>
                    </a>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</nav>

<slot/>

<style lang="scss">
    :root {
        --sl-font-size-medium: 1.6rem;
    }
    
    :global(body) {
        /* font-family: 'Roboto', var(--sl-font-sans) */
    }
    :global(.navigation + .container) {
        /* padding-bottom: 7.5rem; */
        padding-top: 7.5rem;
    }
    :global(.container) {
        max-width: 80rem;
        margin: 0 auto;
        padding: 0 2rem;
        position: relative;
        width: 100%;
    }
    .navbar {
        margin-bottom: 5px;
        z-index: 150;
        border-radius: 0;
    }
    .navbar .title {
        color: white;
    }
</style>