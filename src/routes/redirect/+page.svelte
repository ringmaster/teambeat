<script>
    import { pbStore } from 'svelte-pocketbase';
    import { goto } from '$app/navigation';
    
    const redirectUrl = location.protocol + '//' + location.host + "/redirect"
    
    let result = 'Authenticating...';
    
    // parse the query parameters from the redirected url
    const params = (new URL(window.location)).searchParams;
    
    // load the previously stored provider's data
    const provider = JSON.parse(localStorage.getItem('provider'))
    
    // compare the redirect's state param and the stored provider's one
    if (provider.state !== params.get('state')) {
        throw "State parameters don't match.";
    }
    
    // authenticate
    $pbStore.collection('users').authWithOAuth2(
    provider.name,
    params.get('code'),
    provider.codeVerifier,
    redirectUrl,
    // pass optional user create data
    {
        emailVisibility: false,
    }
    ).then((authData) => {
        result = JSON.stringify(authData, null, 2);
        document.cookie = $pbStore.authStore.exportToCookie({ httpOnly: false, secure: false })
        goto("/");
    }).catch((err) => {
        result = "Failed to exchange code.\n" + err;
    });
    
</script>

<div class="container">
    <pre>{result}</pre>
</div>