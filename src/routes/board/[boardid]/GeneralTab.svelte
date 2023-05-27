<script>
    import { pbStore } from "svelte-pocketbase";
    import notify from "$utils/notify";
    import { goto } from '$app/navigation';
    import { addDemoData } from "./demo";
    
    let confirmDelete =false;
    let confirmDemo =false;
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
</script>

<div class="columns">
    <div class="column is-two-thirds">
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