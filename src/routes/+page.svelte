<script>
    import { pbStore, User } from 'svelte-pocketbase';
    import { env } from '$env/dynamic/public';
    
    pbStore.set(env.PUBLIC_POCKETBASE_URL);
    
    let username = ''
    let password = ''
    
    async function doLogin() {
        const authData = await $pbStore.collection('users').authWithPassword(username, password)
        document.cookie = $pbStore.authStore.exportToCookie({ httpOnly: false })
        document.location = "/"
    }
</script>

<h1>Welcome to Teambeat</h1>

<p>Teambeat is a tool for realtime retrospectives, surveys, and team pulse checks.</p>

<User let:user>
    <div>
        <p>Name: {user?.name}</p>
        <p>Email: {user?.email}</p>
    </div>
    <div slot="signedout">
        <form on:submit={doLogin}>
            <fieldset>
                <label for="username">Username</label>
                <input type="text" placeholder="username" id="username" bind:value="{username}">
                
                <label for="password">Password</label>
                <input type="password" placeholder="password" id="password" bind:value="{password}">
                
                <input class="button-primary" type="submit" value="Send">
            </fieldset>
        </form>
    </div>
</User>