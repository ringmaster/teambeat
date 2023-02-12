<script>
    import { pbStore, User } from 'svelte-pocketbase';
    import { env } from '$env/dynamic/public';
    
    pbStore.set(env.PUBLIC_POCKETBASE_URL);
</script>

<div class="container">

<User let:user>

<h1>Account - {user.name}</h1>

<form>
    <fieldset>
        <label for="name">Name</label>
        <input type="text" placeholder="name" id="name" value="{user.name}">

        <label for="email">Email</label>
        <input type="text" placeholder="name" id="email" value="{user.email}">

        <label for="username">Username</label>
        <input type="text" placeholder="username" id="username" value="{user.username}">

        <label for="password">Password</label>
        <input type="password" placeholder="password" id="password" value="{user.password}">
          
      <input class="button-primary" type="submit" value="Update">
    </fieldset>
  </form>

</User>
</div>