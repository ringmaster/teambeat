<script>
    import { pbStore } from 'svelte-pocketbase';
    import { env } from '$env/dynamic/public';
    //import "./milligram-mod.sass";

    
    pbStore.set(env.PUBLIC_POCKETBASE_URL);
    
    $: loggedIn = $pbStore.authStore.isValid
    $: user = $pbStore.authStore.model
    
    function doLogout() {
        $pbStore.authStore.clear()
        document.cookie = $pbStore.authStore.exportToCookie({ httpOnly: false, expires: 0 })
        document.location = "/"
    }
</script>

<svelte:head>
<script src="https://kit.fontawesome.com/7e2abaa70e.js" crossorigin="anonymous"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0/dist/themes/light.css" />
<script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0/dist/shoelace.js"></script>
</svelte:head>

<nav class="navigation">
    <div class="container">
        <a href="/" class="navigation-title">
            <i class="fa-sharp fa-solid fa-wave-pulse"></i>
            <h1 class="title">Teambeat</h1>
        </a>
        <ul class="navigation-list float-right">
            <li class="navigation-item">
                {#if loggedIn}
                <sl-dropdown>
                    <sl-button slot="trigger" caret><i class="fa-solid fa-user"></i> {user.name}</sl-button>
                    <sl-menu>
                        <sl-menu-item><a href="/account">Account</a></sl-menu-item>
                        <sl-divider></sl-divider>
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <sl-menu-item on:click="{doLogout}">
                            Log Out
                            <i class="fa-solid fa-right-from-bracket"></i>
                        </sl-menu-item>
                    </sl-menu>
                </sl-dropdown>
                {:else}
                <a href="/login" class="navigation-link">
                    <i class="fa-solid fa-user"></i>
                    Log In
                </a>        
                {/if}
            </li>
        </ul>
    </div>
</nav>

<slot/>

<style lang="scss">
    /* @import "../../node_modules/milligram/dist/milligram.min.css"; */
    @import "https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css";
    
    :root {
        --sl-font-size-medium: 1.6rem;
    }
    
    .navigation {
        background: #f4f5f6;
        border-bottom: 0.1rem solid #d1d1d1;
        display: block;
        height: 5.2rem;
        left: 0;
        max-width: 100%;
        position: fixed;
        right: 0;
        top: 0;
        width: 100%;
        z-index: 2;
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
    .navigation .navigation-link, .navigation .navigation-title, .navigation .title {
        display: inline;
        font-size: 1.6rem;
        line-height: 5.2rem;
        padding: 0;
        text-decoration: none;
    }
    
    .navigation .navigation-title, .navigation .title {
        color: #606c76;
        font-family: Gotham Rounded A,Gotham Rounded B,Helvetica Neue,Arial,sans-serif;
        position: relative;
    }
    .float-right {
        float: right;
    }
    .navigation .navigation-list {
        list-style: none;
        margin-bottom: 0;
        margin-right: 5rem;
    }
    
    .navigation .navigation-item {
        float: left;
        margin-bottom: 0;
        margin-left: 2.5rem;
        position: relative;
    }
</style>