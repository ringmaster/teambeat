<script>
  import { pbStore } from 'svelte-pocketbase';
  import notify from '../../utils/notify';
  
  $pbStore.collection('users').authRefresh();

  let user = $pbStore.authStore.model;
  let loading = false;

  function updateUser() {
    loading = true;
    $pbStore.collection('users').update(user.id, user).then(()=>{
      loading = false;
      notify("Updated user record successfully.", "info")
    }).catch((error)=>{
      loading = false;
      notify(error, "error")
    })
  }
</script>

<div class="container">
  
  <h1 class="title">Account - {user.id}</h1>
  
  <form on:submit="{updateUser}">
    <div class="field">
      <label class="label" for="name">Name</label>
      <div class="control">
        <input class="input" type="text" placeholder="name" id="name" bind:value="{user.name}">
      </div>
    </div>
    
    <div class="field">
      <label class="label" for="email">Email</label>
      <div class="control">
        <input class="input" type="text" placeholder="name" id="email" bind:value="{user.email}">
      </div>
    </div>
    
    <div class="field">
      <label class="label" for="username">Username</label>
      <div class="control">
        <input class="input" type="text" placeholder="username" id="username" bind:value="{user.username}">
      </div>
    </div>
    
    <div class="field">
      <label class="label" for="password">Old Password</label>
      <div class="control">
        <input class="input" type="password" placeholder="password" id="password" bind:value="{user.password}">
      </div>
    </div>
    
    <div class="field">
      <label class="label" for="newpassword">New Password</label>
      <div class="control">
        <input class="input" type="password" placeholder="password" id="newpassword" bind:value="{user.newpassword}">
      </div>
    </div>
    
    <div class="field">
      <label class="label" for="confirmpassword">Confirm New Password</label>
      <div class="control">
        <input class="input" type="password" placeholder="password" id="confirmpassword" bind:value="{user.confirmpassword}">
      </div>
    </div>
    
    <div class="field is-grouped">
      <div class="control">
        <input class="button is-primary" class:is-loading={loading} type="submit" value="Update">
      </div>
    </div>
    
  </form>
  
</div>