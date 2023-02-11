<script>
  export let data
  
  let username = ''
  let password = ''
  
  $: loggedIn = data.pb.authStore.isValid
  $: user = data.pb.authStore.model
  
  async function doLogin() {
    const authData = await data.pb.collection('users').authWithPassword(username, password)
    document.cookie = data.pb.authStore.exportToCookie({ httpOnly: false })
    document.location = "/"
  }
  
  function doLogout() {
    data.pb.authStore.clear()
    document.cookie = data.pb.authStore.exportToCookie({ httpOnly: false, expires: 0 })
    document.location = "/"
  }
</script>

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
