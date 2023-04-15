<script>
    import { pbStore } from "svelte-pocketbase";
	import notify from "$utils/notify";
    
    export let board;
    
    let newVoteType = '';
    
    function addVoteType() {
        if(newVoteType == '') {
            notify("Please specify a name for the new type of vote.", "error");
            return;
        }

        const voteTypeData = {
            "typename": newVoteType,
            "amount": 0,
            "board": board.id
        }
        $pbStore.collection('votetypes').create(voteTypeData).then(()=>{
            newVoteType = '';
        })
    }
    
    function delVoteType(id) {
        $pbStore.collection('votetypes').delete(id).then(()=>{
            //getBoard();
        })
    }
    
</script>

<table class="table">
    <thead><tr>
        <th>Vote Type</th>
        <th>Available</th>
        <th>Delete</th>
    </tr></thead>
    <tbody>
        {#each board.votetypes as votetype}
        <tr>
            <td>{votetype.typename}</td>
            <td>{votetype.amount}</td>
            <td>
                <button class="button is-small is-danger is-light" on:click={()=>delVoteType(votetype.id)} disabled={votetype.typename == 'votes'} class:is-disabled={votetype.typename == 'votes'}>
                    <span>Delete</span>
                    <span class="icon is-small">
                        <i class="fas fa-times"></i>
                    </span>
                </button>
            </td>
        </tr>
        {/each}
        <tr>
            <td><input type="text" class="input" bind:value={newVoteType} on:keypress={(e)=>{if(e.key == 'Enter')addVoteType()}}></td>
            <td colspan="5">
                <button class="button is-small is-success is-light" on:click={addVoteType}>
                    <span class="icon is-small">
                        <i class="fas fa-plus"></i>
                    </span>
                    <span>Add</span>
                </button>
            </td>
        </tr>
    </tbody>
</table>

<style>
    .table thead {
        position: sticky;
        top: 0px;
        z-index: 100;
        background: rgb(255,255,255);
        background: linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 25%);
    }
</style>