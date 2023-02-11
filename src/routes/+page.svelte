<script>
    export let data
    
    $: loggedIn = data.pb.authStore.isValid
</script>

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
        {#each data.boards as board}
        <tr>
            <td><a href="/board/{board.id}">{board.name}</a></td>
            <td>
                <ul>{#each board.facilitators as facilitator}
                    <li>{facilitator}</li>
                    {/each}
                </ul>
            </td>
            <td>
                <ul>{#each board.users as user}
                    <li>{user}</li>
                    {/each}
                </ul>
            </td>
            <td>{board.created}</td>
        </tr>
        {/each}
    </tbody>
</table>
{/if}