<script>
  import { pbStore } from 'svelte-pocketbase';
  import notify from '../../utils/notify';
  import { goto } from '$app/navigation';
  
  //$pbStore.collection('users').authRefresh();
  
  let user = $pbStore.authStore.model;
  let loading = false;
  let confirmDelete = false;
  
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
  
  function deleteAccount() {
    if(!confirmDelete) {
      notify('Check the box to confirm deletion of this account.');
      return;
    }
    $pbStore.collection('users').delete(user.id).then(()=>{
      loading = false;
      notify("Account has been deleted.", "info")
      goto('/');
    }).catch((error)=>{
      loading = false;
      notify(error, "error")
    })
  }
</script>

<div class="container">
  
  <h1 class="title">Account - {user.id}</h1>
  
  <form>
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
        <button class="button is-primary" class:is-loading={loading} on:click={updateUser}>Update</button>
      </div>
      <div class="control">
        <button class="button is-warning" class:is-loading={loading} on:click={deleteAccount}>
          <span class="icon is-small"><input class="checkbox" type="checkbox" bind:checked={confirmDelete} on:click={(e)=>e.stopPropagation()}></span>
          <span>Delete Account</span>
        </button>
        
      </div>
    </div>
    
  </form>
  
</div>