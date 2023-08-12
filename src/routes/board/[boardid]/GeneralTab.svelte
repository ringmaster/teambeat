<script>
    import { pbStore } from "svelte-pocketbase";
    import notify from "$utils/notify";
    import { goto } from '$app/navigation';
    import { addDemoData } from "./demo";
    
    let confirmDelete =false;
    let confirmDemo =false;
    let confirmAnonymize =false;
    export let board;
    
    $: users = board.expandedusers ? board.expandedusers : []
    
    function deleteBoard(){
        if(confirmDelete) {
            goto("/");
            $pbStore.collection('boards').delete(board.id).then(()=>{
            }).catch(err => notify(err.message, "error"))
        } else {
            notify("Check the box to confirm the deletion of this board.", "warning", "exclamation-triangle")
        }
    }

    function demoBoard(){
        if(confirmDemo) {
            addDemoData(board);
        }
        else {
            notify("Check the box to confirm adding demo content to this board.", "warning", "exclamation-triangle")
        }
    }

    function anonymizeBoard(){
        if(confirmAnonymize) {
            board.anonymous = true;
            $pbStore.collection('boards').update(board.id, board).then(()=>{
                notify("This board will no longer display user-associated information.", "info")
            }).catch(err => notify(err.message, "error"))
        } else {
            notify("Check the box to permanently remove display of user-associated contributions.", "warning", "exclamation-triangle")
        }
    }
</script>

<div class="columns">
    <div class="column is-one-third">
        <table class="table">
            <thead>
                <tr>
                    <th>Username</th>
                    <th>Anonymous</th>
                    <th>Facilitator</th>
                </tr>
            </thead>
            <tbody>
                {#each users as user}
                <tr>
                    <td>{user.name}</td>
                    <td>
                        {#if user.anonymous}
                        <i class="fa-regular fa-square-check"></i>
                        {:else}
                        <i class="fa-regular fa-square"></i>
                        {/if}
                    <td><input class="checkbox" type="checkbox" checked={board.facilitators.indexOf(user.id) != -1}></td>
                </tr>
                {/each}
            </tbody>
        </table>
    </div>
    <div class="column">
        <div class="field is-grouped">
            {#if !board.anonymous}
            <div class="control">
                <button class="button is-link is-light" on:click={anonymizeBoard}>
                    <span class="icon is-small"><input class="checkbox" type="checkbox" bind:checked={confirmAnonymize} on:click={(e)=>e.stopPropagation()}></span>
                    <span>Anonymize Board</span>
                </button>
            </div>
            {/if}
            <div class="control">
                <button class="button is-link is-light" on:click={deleteBoard}>
                    <span class="icon is-small"><input class="checkbox" type="checkbox" bind:checked={confirmDelete} on:click={(e)=>e.stopPropagation()}></span>
                    <span>Delete Board</span>
                </button>
            </div>
            <div class="control">
                <button class="button is-link is-light" on:click={demoBoard}>
                    <span class="icon is-small"><input class="checkbox" type="checkbox" bind:checked={confirmDemo} on:click={(e)=>e.stopPropagation()}></span>
                    <span>Demo Data</span>
                </button>
            </div>
        </div>
    </div>
</div>