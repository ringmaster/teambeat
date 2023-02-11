<script>
    import { pbStore, User } from 'svelte-pocketbase';

    export let data

    $: loggedIn = data.pb.authStore.isValid
    $: user = data.pb.authStore.model
    
    function doLogout() {
        data.pb.authStore.clear()
        document.cookie = data.pb.authStore.exportToCookie({ httpOnly: false, expires: 0 })
        document.location = "/"
    }
</script>

<svelte:head>
<script src="https://kit.fontawesome.com/7e2abaa70e.js" crossorigin="anonymous"></script>
</svelte:head>

<div class="wrapper">
    <nav class="navigation">
        <div class="container">
            <a href="/" class="navigation-title">
                <i class="fa-sharp fa-solid fa-wave-pulse"></i>
                <h1 class="title">Teambeat</h1>
            </a>
            <ul class="navigation-list float-right">
                <li class="navigation-item">
                    {#if loggedIn}
                        <a href="/account" class="navigation-link">
                            <i class="fa-solid fa-user"></i>
                            {user.name}
                        </a>
                        <a href="#" class="navigation-link" on:click="{doLogout}"><i class="fa-solid fa-right-from-bracket"></i></a>
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
    <div class="container">
        <slot/>
    </div>
</div>

<style>
    @import "../../node_modules/milligram/dist/milligram.min.css";
    :global(html) {
        color: red;
    }
    .wrapper {
        display: block;
        overflow: hidden;
        position: relative;
        width: 100%;
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
    
    .wrapper>.container {
        padding-bottom: 7.5rem;
        padding-top: 7.5rem;
    }
    .wrapper .container {
        max-width: 80rem;
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