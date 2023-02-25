<script>
  import { pbStore } from 'svelte-pocketbase';
  
  $: loggedIn = $pbStore.authStore.isValid
  $: user = $pbStore.authStore.model
  
  export let data
  
  let username = ''
  let password = ''  
  
  async function doLogin() {
    const authData = await $pbStore.collection('users').authWithPassword(username, password)
    document.cookie = $pbStore.authStore.exportToCookie({ httpOnly: false, secure: false })
    document.location = "/"
  }
  
  function doLogout() {
    $pbStore.authStore.clear()
    document.cookie = $pbStore.authStore.exportToCookie({ httpOnly: false, expires: 0, secure: false })
    document.location = "/"
  }
</script>

<svelte:head>
    <title>Teambeat - Log In</title>
</svelte:head>

<div class="container">
  
  <h1>Login</h1>
  
  {#if loggedIn}
  <button on:click={doLogout}>Log Out</button>
  {:else}
  <form on:submit={doLogin}>
    <fieldset>
      <label for="username">Username</label>
      <input type="text" placeholder="username" id="username" bind:value="{username}">
      
      <label for="password">Password</label>
      <input type="password" placeholder="password" id="password" bind:value="{password}">
      
      <input class="button-primary" type="submit" value="Send">
    </fieldset>
  </form>
  {/if}
</div>