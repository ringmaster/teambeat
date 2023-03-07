<script>
    import { pbStore } from "svelte-pocketbase";
    import notify from "../../../utils/notify";
    import { goto } from '$app/navigation';

    let confirmDelete =false;
    export let board;
        
    function deleteBoard(){
        if(confirmDelete) {
            $pbStore.collection('boards').delete(board.id).then(()=>{
                goto("/");
            })
        } else {
            notify("Check the box to confirm the deletion of this board.", "warning", "exclamation-triangle")
        }
    }
</script>

<div class="columns">
    <div class="column">
<div class="content">
    <h3 class="subtitle">Other things that should be here...</h3>
    <ul>
        <li>List of facilitators</li>
        <li>Users active on this board?</li>
    </ul>
</div>
<div class="field is-grouped">
    <div class="control">
        <button class="button is-link is-light" on:click={deleteBoard}>
            <span class="icon is-small"><input class="checkbox" type="checkbox" bind:checked={confirmDelete} on:click={(e)=>e.stopPropagation()}></span>
            <span>Delete Board</span>
        </button>
    </div>
</div>
    </div>
    <div class="column">
        <textarea class="textarea">{JSON.stringify(board)}</textarea>
    </div>
</div>