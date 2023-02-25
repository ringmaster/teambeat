<script>
  import { pbStore } from 'svelte-pocketbase';
  
  $: user = $pbStore.authStore.model
</script>

<div class="container">
  
  <h1 class="title">Account - {user.name}</h1>
  
  <form>
    <div class="field">
      <label class="label" for="name">Name</label>
      <div class="control">
        <input class="input" type="text" placeholder="name" id="name" value="{user.name}">
      </div>
    </div>
    
    <div class="field">
      <label class="label" for="email">Email</label>
      <div class="control">
        <input class="input" type="text" placeholder="name" id="email" value="{user.email}">
      </div>
    </div>
    
    <div class="field">
      <label class="label" for="username">Username</label>
      <div class="control">
        <input class="input" type="text" placeholder="username" id="username" value="{user.username}">
      </div>
    </div>
    
    <div class="field">
      <label class="label" for="password">Password</label>
      <div class="control">
        <input class="input" type="password" placeholder="password" id="password" value="{user.password}">
      </div>
    </div>
    
    <div class="field is-grouped">
      <div class="control">
        <input class="button is-primary" type="submit" value="Update">
      </div>
    </div>
    
  </form>
  
</div>