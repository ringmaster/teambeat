<script>
    import { pbStore } from 'svelte-pocketbase';
    
    $: loggedIn = $pbStore.authStore.isValid
    
    $: getboards = $pbStore.collection('boards').getFullList(10, {
        sort: '-created',
        expand: "users,facilitators"
    });
    
</script>

<div class="container">
    
    <h1>Welcome to Teambeat</h1>
    
    <p>Teambeat is a tool for realtime retrospectives, surveys, and team pulse checks.</p>
    
    {#if loggedIn}
    <h2>Your Boards</h2>
    <table>
        <thead>
            <tr>
                <th>Board Name</th>
                <th>Facilitators</th>
                <th>Users</th>
                <th>Created</th>
            </tr>
        </thead>
        <tbody>
            {#await getboards}
            <tr><td colspan="4"><div class="centered">Loading...</div></td></tr>
            {:then boards} 
            {#each boards as board}
            <tr>
                <td><a href="/board/{board.id}">{board.name}</a></td>
                <td>
                    <ul>{#each board.expand.facilitators as facilitator}
                        <li>{facilitator.name}</li>
                        {/each}
                    </ul>
                </td>
                <td>
                    <ul>{#each board.expand.users as user}
                        <li>{user.name}</li>
                        {/each}
                    </ul>
                </td>
                <td>{board.created}</td>
            </tr>
            {/each}         
            {:catch error}
            <tr><td colspan="4" style="color: red">{error.message}</td></tr>       
            {/await}
        </tbody>
    </table>
    {/if}
</div>


<style>
    .centered {
        text-align: center;
    }
</style>