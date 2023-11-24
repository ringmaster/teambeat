<script>
  import { pbStore } from 'svelte-pocketbase';
  import notify from "../../utils/notify";
  import { goto } from '$app/navigation';
  
  $: loggedIn = $pbStore.authStore.isValid
  $: user = $pbStore.authStore.model
  
  let username = ''
  let password = ''
  let loggingin = false
  
  let providerCall = $pbStore.collection('users').listAuthMethods();
  
  const redirectUrl = location.protocol + '//' + location.host + "/redirect"
  
  async function doLogin() {
    loggingin = true;
    try {
      $pbStore.collection('users').authWithPassword(username, password)
      .then((authData)=>{
        document.cookie = $pbStore.authStore.exportToCookie({ httpOnly: false, secure: false })
        goto("/");
      })
      .catch((error)=>{
        console.log(error);
        notify("There was a problem authenticating.  Please check your credentials and try again.", "error", "error");
        loggingin = false;
      })
      
    } catch (error) {
      console.log(error);
      alert('error');
    }
  }
  
  function doLogout() {
    $pbStore.authStore.clear()
    document.cookie = $pbStore.authStore.exportToCookie({ httpOnly: false, expires: 0, secure: false })
    goto("/");
  }
  
  function setProvider(provider) {
    localStorage.setItem('provider', JSON.stringify(provider));
  }
</script>

<svelte:head>
<title>Teambeat - Log In</title>
</svelte:head>

<div class="container">
  
  <h1 class="title">Login</h1>
  
  {#if loggedIn}
  <button on:click={doLogout}>Log Out</button>
  {:else}
  
  <div class="columns">
    <div class="column">
      <form on:submit={doLogin}>
        
        <div class="field">
          <label for="username" class="label">Username</label>
          <div class="control">
            <input type="text" class="input" placeholder="username" id="username" bind:value="{username}">
          </div>
        </div>
        
        <div class="field">
          <label class="label" for="password">Password</label>
          <div class="control">
            <input class="input" type="password" placeholder="password" id="password" bind:value="{password}">
          </div>
        </div>
        
        <div class="field is-grouped">
          <div class="control">
            <input class="button is-primary" type="submit" value="Log In" class:is-loading="{loggingin}">
          </div>
        </div>
      </form>
      
      <p>
        <small>
          <a href="/forgot">Darn, I forgot my password.</a>
        </small>
      </p>
      
    </div>
    <div class="column">
      
      <h2 class="title">3rd Party Logins</h2>
      <p>You may also use one of the following providers to log in:</p>
      
      {#await providerCall}
      <p>Loading available providers...</p>
      {:then authMethods} 
      <ul>
        {#each authMethods.authProviders as provider}
        <li><a href="{provider.authUrl + redirectUrl}" on:click="{()=>setProvider(provider)}">{provider.name}</a></li>
        {/each}
      </ul>    
      {/await}
    </div>
  </div>
  
  {/if}
</div>