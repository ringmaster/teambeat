<script>
  import { pbStore } from 'svelte-pocketbase';
  import notify from "../../utils/notify";
  import { goto } from '$app/navigation';
  
  $: loggedIn = $pbStore.authStore.isValid
  
  let email = ''
  let loggingin = false
    
  async function doRequest() {
    loggingin = true;
    $pbStore.collection('users').requestPasswordReset('test@example.com')
    .then(()=>{
      notify("A password reset email has been sent.  Please check your email for instructions.");
      loggingin = false;
    })
    .catch((error)=>{
      notify("There was a problem sending a password reset email.  Please check your email address and try again.", "error", "error");
      loggingin = false;
    })
  }
  
  function doLogout() {
    $pbStore.authStore.clear()
    document.cookie = $pbStore.authStore.exportToCookie({ httpOnly: false, expires: 0, secure: false })
    goto("/");
  }
</script>

<svelte:head>
<title>Teambeat - Forgotten Password</title>
</svelte:head>

<div class="container">
  
  <h1 class="title">Login</h1>
  
  {#if loggedIn}
  <button on:click={doLogout}>Log Out</button>
  {:else}
  
  <div class="columns">
    <div class="column">
      <form on:submit={doRequest}>
        
        <div class="field">
          <label for="email" class="label">Email</label>
          <div class="control">
            <input type="text" class="input" placeholder="email" id="email" bind:value="{email}">
          </div>
        </div>
              
        <div class="field is-grouped">
          <div class="control">
            <input class="button is-primary" type="submit" value="Get Password Reset Email" class:is-loading="{loggingin}">
          </div>
        </div>
      </form>
      
    </div>
  </div>
  
  {/if}
</div>